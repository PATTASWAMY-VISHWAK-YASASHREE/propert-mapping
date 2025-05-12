import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  Tooltip,
  Fab,
  Zoom,
  Slide,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Button
} from '@material-ui/core';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  InsertEmoticon as EmojiIcon,
  Refresh as RefreshIcon
} from '@material-ui/icons';
import chatService from '../../services/chatService';
import { useAlert } from '../../contexts/AlertContext';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 1000,
  },
  chatButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  chatWindow: {
    width: 320,
    height: 450,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    boxShadow: theme.shadows[6],
  },
  chatHeader: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitle: {
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  chatActions: {
    display: 'flex',
    alignItems: 'center',
  },
  chatBody: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
  },
  messageItem: {
    marginBottom: theme.spacing(1),
    maxWidth: '80%',
    alignSelf: 'flex-start',
    '&.own': {
      alignSelf: 'flex-end',
    },
  },
  messageBubble: {
    padding: theme.spacing(1, 2),
    borderRadius: 16,
    backgroundColor: theme.palette.grey[100],
    wordBreak: 'break-word',
    '&.own': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.contrastText,
    },
  },
  messageTime: {
    fontSize: '0.7rem',
    color: theme.palette.text.secondary,
    marginTop: 2,
    textAlign: 'right',
  },
  chatFooter: {
    padding: theme.spacing(1, 2),
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
  },
  inputField: {
    flexGrow: 1,
    marginRight: theme.spacing(1),
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: theme.spacing(1),
  },
  online: {
    backgroundColor: theme.palette.success.main,
  },
  offline: {
    backgroundColor: theme.palette.error.main,
  },
  userAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  channelSelector: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  channelItem: {
    borderRadius: theme.shape.borderRadius,
    '&.selected': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  refreshButton: {
    marginTop: theme.spacing(2),
  },
}));

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Helper function to get initials from name
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
};

const ChatWidget = () => {
  const classes = useStyles();
  const { setAlert } = useAlert();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChannels, setShowChannels] = useState(false);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  
  // Initialize chat when widget is opened
  useEffect(() => {
    if (open && !currentChannel) {
      initializeChat();
    }
    
    // Clean up when component unmounts
    return () => {
      if (connectionStatus === 'connected') {
        chatService.disconnectSocket();
      }
    };
  }, [open]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && open) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);
  
  // Initialize chat and fetch data
  const initializeChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize WebSocket connection
      await chatService.initializeSocket();
      setConnectionStatus('connected');
      
      // Set up event listeners
      const messageListener = chatService.addEventListener('message:new', (message) => {
        // Only add message if it's for the current channel
        if (currentChannel && message.channel_id === currentChannel.id) {
          setMessages((prevMessages) => [...prevMessages, message]);
        } else {
          // Increment unread count if chat is not open or for a different channel
          if (!open) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      });
      
      const connectionListener = chatService.addEventListener('connection', () => {
        setConnectionStatus('connected');
      });
      
      const disconnectListener = chatService.addEventListener('disconnect', () => {
        setConnectionStatus('disconnected');
      });
      
      // Fetch server data
      const response = await chatService.getServer();
      
      if (response.success) {
        setChannels(response.data.channels);
        
        // Set default channel
        if (response.data.channels.length > 0) {
          const generalChannel = response.data.channels.find(c => c.name === 'general') || response.data.channels[0];
          handleChannelSelect(generalChannel);
        }
      } else {
        setError(response.error || 'Error loading chat channels');
      }
      
      setLoading(false);
      
      // Return cleanup function
      return () => {
        messageListener();
        connectionListener();
        disconnectListener();
      };
    } catch (error) {
      console.error('Error initializing chat:', error);
      setError(error.message || 'Error connecting to chat server');
      setLoading(false);
    }
  };
  
  // Handle channel selection
  const handleChannelSelect = async (channel) => {
    try {
      setCurrentChannel(channel);
      setMessages([]);
      setShowChannels(false);
      
      // Join channel via WebSocket
      chatService.joinChannel(channel.id);
      
      // Fetch channel messages
      const response = await chatService.getChannelMessages(channel.id);
      
      if (response.success) {
        setMessages(response.data);
      } else {
        setAlert('Error loading messages', 'error');
      }
    } catch (error) {
      console.error('Error selecting channel:', error);
      setAlert('Error loading channel messages', 'error');
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentChannel || !messageText.trim() || connectionStatus !== 'connected') return;
    
    try {
      // Optimistically add message to UI
      const tempId = `temp-${Date.now()}`;
      const tempMessage = {
        id: tempId,
        content: messageText,
        created_at: new Date().toISOString(),
        user: {
          first_name: 'You',
          last_name: '',
        },
        isTemp: true,
      };
      
      setMessages([...messages, tempMessage]);
      setMessageText('');
      
      // Send message to server
      const response = await chatService.sendMessage(currentChannel.id, messageText);
      
      if (!response.success) {
        // Remove temp message and show error
        setMessages(messages.filter(msg => msg.id !== tempId));
        setAlert('Error sending message', 'error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert('Error sending message', 'error');
    }
  };
  
  // Toggle chat widget
  const toggleChat = () => {
    setOpen(!open);
    if (!open) {
      // Reset unread count when opening chat
      setUnreadCount(0);
    }
  };
  
  // Toggle channels list
  const toggleChannels = () => {
    setShowChannels(!showChannels);
  };
  
  // Retry connection
  const handleRetryConnection = () => {
    initializeChat();
  };
  
  return (
    <div className={classes.root}>
      {/* Chat Window */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Paper className={classes.chatWindow} elevation={6}>
          {/* Chat Header */}
          <div className={classes.chatHeader}>
            <div className={classes.chatTitle}>
              <ChatIcon fontSize="small" />
              <Typography variant="subtitle1">
                {currentChannel ? `#${currentChannel.name}` : 'Chat'}
              </Typography>
            </div>
            <div className={classes.chatActions}>
              <Tooltip title="Change channel">
                <IconButton size="small" color="inherit" onClick={toggleChannels}>
                  {showChannels ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Close chat">
                <IconButton size="small" color="inherit" onClick={toggleChat}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          
          {/* Channel Selector */}
          <Zoom in={showChannels}>
            <div className={classes.channelSelector}>
              <Typography variant="subtitle2" gutterBottom>
                Available Channels
              </Typography>
              <List dense>
                {channels.map((channel) => (
                  <ListItem
                    button
                    key={channel.id}
                    className={`${classes.channelItem} ${currentChannel?.id === channel.id ? 'selected' : ''}`}
                    onClick={() => handleChannelSelect(channel)}
                    selected={currentChannel?.id === channel.id}
                  >
                    <ListItemText primary={`#${channel.name}`} />
                  </ListItem>
                ))}
              </List>
            </div>
          </Zoom>
          
          {/* Chat Body */}
          <div className={classes.chatBody} ref={chatBodyRef}>
            {loading ? (
              <div className={classes.loadingContainer}>
                <CircularProgress size={24} />
              </div>
            ) : error ? (
              <div className={classes.emptyState}>
                <Typography variant="body1" gutterBottom>
                  {error}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<RefreshIcon />}
                  className={classes.refreshButton}
                  onClick={handleRetryConnection}
                >
                  Retry
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <div className={classes.emptyState}>
                <Typography variant="body1">
                  No messages yet
                </Typography>
                <Typography variant="body2">
                  Be the first to send a message!
                </Typography>
              </div>
            ) : (
              <div className={classes.messageList}>
                {messages.map((message) => {
                  const isOwnMessage = message.user.first_name === 'You' || message.isTemp;
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`${classes.messageItem} ${isOwnMessage ? 'own' : ''}`}
                    >
                      {!isOwnMessage && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                          <Avatar className={classes.userAvatar}>
                            {getInitials(message.user.first_name, message.user.last_name)}
                          </Avatar>
                          <Typography variant="caption">
                            {message.user.first_name} {message.user.last_name}
                          </Typography>
                        </div>
                      )}
                      <div className={`${classes.messageBubble} ${isOwnMessage ? 'own' : ''}`}>
                        {message.content}
                      </div>
                      <div className={classes.messageTime}>
                        {formatDate(message.created_at)}
                        {message.isTemp && ' (sending...)'}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Chat Footer */}
          <div className={classes.chatFooter}>
            <form className={classes.inputForm} onSubmit={handleSendMessage}>
              <div 
                className={`${classes.statusIndicator} ${connectionStatus === 'connected' ? classes.online : classes.offline}`}
              />
              <TextField
                className={classes.inputField}
                placeholder={connectionStatus === 'connected' ? 
                  'Type a message...' : 'Disconnected from chat server'
                }
                variant="outlined"
                size="small"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={connectionStatus !== 'connected' || !currentChannel}
              />
              <Tooltip title="Send message">
                <span>
                  <IconButton 
                    type="submit" 
                    color="primary" 
                    disabled={!messageText.trim() || connectionStatus !== 'connected' || !currentChannel}
                  >
                    <SendIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </form>
          </div>
        </Paper>
      </Slide>
      
      {/* Chat Button */}
      <Badge 
        color="secondary" 
        badgeContent={unreadCount} 
        invisible={unreadCount === 0}
        className={classes.unreadBadge}
      >
        <Fab
          color="primary"
          aria-label="chat"
          className={classes.chatButton}
          onClick={toggleChat}
        >
          <ChatIcon />
        </Fab>
      </Badge>
    </div>
  );
};

export default ChatWidget;
import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper,
  Grid,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Badge,
  CircularProgress,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Box
} from '@material-ui/core';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Forum as ForumIcon,
  Lock as LockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  InsertEmoticon as EmojiIcon,
  AttachFile as AttachFileIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@material-ui/icons';
import chatService from '../../services/chatService';
import { useAlert } from '../../contexts/AlertContext';

const useStyles = makeStyles((theme) => ({
  root: {
    height: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.default,
  },
  chatContainer: {
    display: 'flex',
    height: '100%',
  },
  sidebar: {
    width: 280,
    borderRight: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
  },
  channelList: {
    overflowY: 'auto',
    flexGrow: 1,
  },
  channelHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  channelItem: {
    borderRadius: 0,
    '&.selected': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  privateChannel: {
    color: theme.palette.text.secondary,
  },
  chatPanel: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatHeaderTitle: {
    display: 'flex',
    alignItems: 'center',
  },
  chatHeaderActions: {
    display: 'flex',
    alignItems: 'center',
  },
  messageList: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
  messageItem: {
    display: 'flex',
    marginBottom: theme.spacing(2),
  },
  messageAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    marginRight: theme.spacing(1),
  },
  messageContent: {
    flexGrow: 1,
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  messageSender: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  messageTime: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
  },
  messageText: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  messageActions: {
    visibility: 'hidden',
    '$messageItem:hover &': {
      visibility: 'visible',
    },
  },
  inputArea: {
    padding: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
  },
  inputField: {
    flexGrow: 1,
    marginRight: theme.spacing(1),
  },
  inputActions: {
    display: 'flex',
  },
  membersList: {
    width: 240,
    borderLeft: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    overflowY: 'auto',
  },
  memberHeader: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  memberItem: {
    borderRadius: 0,
  },
  memberAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    position: 'absolute',
    bottom: 0,
    right: 0,
    border: `2px solid ${theme.palette.background.paper}`,
  },
  online: {
    backgroundColor: theme.palette.success.main,
  },
  away: {
    backgroundColor: theme.palette.warning.main,
  },
  busy: {
    backgroundColor: theme.palette.error.main,
  },
  offline: {
    backgroundColor: theme.palette.grey[500],
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.palette.text.secondary,
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: theme.palette.error.main,
    padding: theme.spacing(2),
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
  },
  retryButton: {
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

const ChatInterface = () => {
  const classes = useStyles();
  const { setAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [server, setServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const messagesEndRef = useRef(null);
  
  // Initialize chat and fetch server data
  useEffect(() => {
    const initChat = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize WebSocket connection
        await chatService.initializeSocket();
        setConnectionStatus('connected');
        
        // Set up event listeners
        const connectionListener = chatService.addEventListener('connection', () => {
          setConnectionStatus('connected');
        });
        
        const disconnectListener = chatService.addEventListener('disconnect', () => {
          setConnectionStatus('disconnected');
        });
        
        const messageListener = chatService.addEventListener('message:new', (message) => {
          setMessages((prevMessages) => [...prevMessages, message]);
        });
        
        const messageUpdateListener = chatService.addEventListener('message:updated', (message) => {
          setMessages((prevMessages) => 
            prevMessages.map((msg) => msg.id === message.id ? message : msg)
          );
        });
        
        const messageDeleteListener = chatService.addEventListener('message:deleted', (data) => {
          setMessages((prevMessages) => 
            prevMessages.filter((msg) => msg.id !== data.id)
          );
        });
        
        const presenceListener = chatService.addEventListener('user:presence', (data) => {
          setMembers((prevMembers) => 
            prevMembers.map((member) => 
              member.id === data.user_id 
                ? { ...member, status: data.status, last_active: data.last_active }
                : member
            )
          );
        });
        
        // Fetch server data
        const response = await chatService.getServer();
        
        if (response.success) {
          setServer(response.data.server);
          setChannels(response.data.channels);
          setMembers(response.data.members);
          
          // Set default channel
          if (response.data.channels.length > 0) {
            const generalChannel = response.data.channels.find(c => c.name === 'general') || response.data.channels[0];
            handleChannelSelect(generalChannel);
          }
        } else {
          setError(response.error || 'Error loading chat server');
          setAlert('Error loading chat server', 'error');
        }
        
        setLoading(false);
        
        // Cleanup function
        return () => {
          connectionListener();
          disconnectListener();
          messageListener();
          messageUpdateListener();
          messageDeleteListener();
          presenceListener();
          chatService.disconnectSocket();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError(error.message || 'Error connecting to chat server');
        setAlert('Error connecting to chat server', 'error');
        setLoading(false);
      }
    };
    
    initChat();
  }, [setAlert]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle channel selection
  const handleChannelSelect = async (channel) => {
    try {
      setCurrentChannel(channel);
      setMessages([]);
      
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
    
    if (!currentChannel || !messageText.trim()) return;
    
    try {
      if (editingMessage) {
        // Edit existing message
        const response = await chatService.editMessage(editingMessage.id, messageText);
        
        if (response.success) {
          setMessages(messages.map(msg => 
            msg.id === editingMessage.id ? response.data : msg
          ));
          setEditingMessage(null);
        } else {
          setAlert('Error editing message', 'error');
        }
      } else {
        // Send new message
        const response = await chatService.sendMessage(currentChannel.id, messageText);
        
        if (!response.success) {
          setAlert('Error sending message', 'error');
        }
      }
      
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      setAlert('Error sending message', 'error');
    }
  };
  
  // Handle message menu open
  const handleMessageMenuOpen = (event, message) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };
  
  // Handle message menu close
  const handleMessageMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMessage(null);
  };
  
  // Handle edit message
  const handleEditMessage = () => {
    setEditingMessage(selectedMessage);
    setMessageText(selectedMessage.content);
    handleMessageMenuClose();
  };
  
  // Handle delete message
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    try {
      const response = await chatService.deleteMessage(selectedMessage.id);
      
      if (response.success) {
        setMessages(messages.filter(msg => msg.id !== selectedMessage.id));
      } else {
        setAlert('Error deleting message', 'error');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      setAlert('Error deleting message', 'error');
    }
    
    handleMessageMenuClose();
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageText('');
  };
  
  // Retry connection
  const handleRetryConnection = () => {
    setLoading(true);
    setError(null);
    
    // Disconnect and reconnect
    chatService.disconnectSocket();
    
    // Re-initialize chat
    chatService.initializeSocket()
      .then(() => {
        setConnectionStatus('connected');
        
        // Fetch server data
        return chatService.getServer();
      })
      .then(response => {
        if (response.success) {
          setServer(response.data.server);
          setChannels(response.data.channels);
          setMembers(response.data.members);
          
          // Set default channel
          if (response.data.channels.length > 0) {
            const generalChannel = response.data.channels.find(c => c.name === 'general') || response.data.channels[0];
            handleChannelSelect(generalChannel);
          }
          
          setLoading(false);
        } else {
          throw new Error(response.error || 'Error loading chat server');
        }
      })
      .catch(error => {
        console.error('Error reconnecting:', error);
        setError(error.message || 'Error reconnecting to chat server');
        setAlert('Error reconnecting to chat server', 'error');
        setLoading(false);
      });
  };
  
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={classes.errorState}>
        <ErrorIcon className={classes.errorIcon} />
        <Typography variant="h6">Error connecting to chat server</Typography>
        <Typography variant="body1">{error}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<RefreshIcon />}
          className={classes.retryButton}
          onClick={handleRetryConnection}
        >
          Retry Connection
        </Button>
      </div>
    );
  }
  
  return (
    <Paper className={classes.root} elevation={3}>
      <div className={classes.chatContainer}>
        {/* Channels Sidebar */}
        <div className={classes.sidebar}>
          <div className={classes.channelHeader}>
            <Typography variant="h6">{server?.name || 'Chat'}</Typography>
            <Typography variant="body2" color="textSecondary">
              {channels.length} channels • {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </Typography>
          </div>
          
          <List className={classes.channelList}>
            {channels.map((channel) => (
              <ListItem
                button
                key={channel.id}
                className={`${classes.channelItem} ${currentChannel?.id === channel.id ? 'selected' : ''}`}
                onClick={() => handleChannelSelect(channel)}
                selected={currentChannel?.id === channel.id}
              >
                <ListItemIcon>
                  {channel.is_private ? <LockIcon fontSize="small" /> : <ForumIcon fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={channel.name}
                  className={channel.is_private ? classes.privateChannel : ''}
                  secondary={`${channel.message_count || 0} messages`}
                />
              </ListItem>
            ))}
          </List>
        </div>
        
        {/* Chat Panel */}
        <div className={classes.chatPanel}>
          {currentChannel ? (
            <>
              <div className={classes.chatHeader}>
                <div className={classes.chatHeaderTitle}>
                  <Typography variant="h6">
                    {currentChannel.is_private ? <LockIcon fontSize="small" /> : '#'} {currentChannel.name}
                  </Typography>
                </div>
                <div className={classes.chatHeaderActions}>
                  <Typography variant="body2" color="textSecondary">
                    {currentChannel.description}
                  </Typography>
                </div>
              </div>
              
              <div className={classes.messageList}>
                {messages.length === 0 ? (
                  <div className={classes.emptyState}>
                    <Typography variant="body1">No messages yet</Typography>
                    <Typography variant="body2">Be the first to send a message!</Typography>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={classes.messageItem}>
                      <Avatar className={classes.messageAvatar}>
                        {getInitials(message.user.first_name, message.user.last_name)}
                      </Avatar>
                      <div className={classes.messageContent}>
                        <div className={classes.messageHeader}>
                          <Typography variant="subtitle2" className={classes.messageSender}>
                            {message.user.first_name} {message.user.last_name}
                          </Typography>
                          <Typography variant="caption" className={classes.messageTime}>
                            {formatDate(message.created_at)}
                            {message.is_edited && ' (edited)'}
                          </Typography>
                          <div className={classes.messageActions}>
                            <IconButton size="small" onClick={(e) => handleMessageMenuOpen(e, message)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
                        <Typography variant="body2" className={classes.messageText}>
                          {message.content}
                        </Typography>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className={classes.inputArea}>
                <form className={classes.inputForm} onSubmit={handleSendMessage}>
                  {editingMessage && (
                    <Box mb={1} display="flex" justifyContent="space-between" alignItems="center" width="100%">
                      <Typography variant="caption" color="primary">
                        Editing message
                      </Typography>
                      <Button size="small" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </Box>
                  )}
                  <TextField
                    className={classes.inputField}
                    placeholder={connectionStatus === 'connected' ? 
                      `Message #${currentChannel.name}` : 
                      'Disconnected from chat server'
                    }
                    variant="outlined"
                    size="small"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    multiline
                    maxRows={4}
                    autoFocus
                    disabled={connectionStatus !== 'connected'}
                  />
                  <div className={classes.inputActions}>
                    <Tooltip title="Add emoji">
                      <span>
                        <IconButton color="primary" disabled={connectionStatus !== 'connected'}>
                          <EmojiIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Attach file">
                      <span>
                        <IconButton color="primary" disabled={connectionStatus !== 'connected'}>
                          <AttachFileIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={connectionStatus === 'connected' ? 'Send message' : 'Disconnected'}>
                      <span>
                        <IconButton 
                          type="submit" 
                          color="primary" 
                          disabled={!messageText.trim() || connectionStatus !== 'connected'}
                        >
                          <SendIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className={classes.emptyState}>
              <Typography variant="h6">Select a channel to start chatting</Typography>
            </div>
          )}
        </div>
        
        {/* Members List */}
        <div className={classes.membersList}>
          <div className={classes.memberHeader}>
            <Typography variant="h6">Members</Typography>
            <Typography variant="body2" color="textSecondary">
              {members.length} members
            </Typography>
          </div>
          
          <List>
            {members.map((member) => (
              <ListItem key={member.id} className={classes.memberItem}>
                <ListItemIcon>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    badgeContent={
                      <div className={`${classes.statusIndicator} ${classes[member.status || 'offline']}`} />
                    }
                  >
                    <Avatar className={classes.memberAvatar}>
                      {getInitials(member.first_name, member.last_name)}
                    </Avatar>
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={`${member.first_name} ${member.last_name}`}
                  secondary={member.role}
                />
              </ListItem>
            ))}
          </List>
        </div>
      </div>
      
      {/* Message Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        keepMounted
        open={Boolean(menuAnchorEl)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={handleEditMessage}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ChatInterface;
import React, { useState, useEffect, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Box,
  CircularProgress,
  Divider
} from '@material-ui/core';
import { Send as SendIcon } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: theme.palette.background.default,
  },
  header: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  channelName: {
    fontWeight: 'bold',
  },
  channelDescription: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
  },
  messageList: {
    flexGrow: 1,
    overflow: 'auto',
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

const ChatPanel = ({ loading, currentChannel, messages, onSendMessage }) => {
  const classes = useStyles();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle message submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    onSendMessage(messageText);
    setMessageText('');
  };
  
  if (loading) {
    return (
      <div className={classes.root}>
        <div className={classes.loadingContainer}>
          <CircularProgress />
        </div>
      </div>
    );
  }
  
  if (!currentChannel) {
    return (
      <div className={classes.root}>
        <div className={classes.emptyState}>
          <Typography variant="h6">Select a channel to start chatting</Typography>
        </div>
      </div>
    );
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h6" className={classes.channelName}>
          #{currentChannel.name}
        </Typography>
        {currentChannel.description && (
          <Typography variant="body2" className={classes.channelDescription}>
            {currentChannel.description}
          </Typography>
        )}
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
        <form className={classes.inputForm} onSubmit={handleSubmit}>
          <TextField
            className={classes.inputField}
            placeholder={`Message #${currentChannel.name}`}
            variant="outlined"
            size="small"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            multiline
            maxRows={4}
            autoFocus
          />
          <IconButton type="submit" color="primary" disabled={!messageText.trim()}>
            <SendIcon />
          </IconButton>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
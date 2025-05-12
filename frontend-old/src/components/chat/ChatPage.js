import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import ChatSidebar from './ChatSidebar';
import ChatPanel from './ChatPanel';
import { initializeChat } from '../../store/actions/chatActions';

const useStyles = makeStyles((theme) => ({
  root: {
    height: 'calc(100vh - 64px)', // Subtract header height
    overflow: 'hidden',
  },
  chatPanel: {
    height: '100%',
    overflow: 'hidden',
  },
}));

const ChatPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  
  // Initialize chat on component mount
  useEffect(() => {
    dispatch(initializeChat());
    
    // Cleanup on unmount
    return () => {
      // Disconnect WebSocket
      import('../../services/chatService').then(module => {
        const chatService = module.default;
        chatService.disconnectSocket();
      });
    };
  }, [dispatch]);
  
  return (
    <Grid container className={classes.root}>
      <Grid item>
        <ChatSidebar />
      </Grid>
      <Grid item xs className={classes.chatPanel}>
        <ChatPanel />
      </Grid>
    </Grid>
  );
};

export default ChatPage;
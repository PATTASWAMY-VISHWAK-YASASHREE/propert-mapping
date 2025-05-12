import React from 'react';
import { Container, Typography, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ChatInterface from '../components/chat/ChatInterface';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
}));

const ChatPage = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Box mb={3}>
        <Typography variant="h4" className={classes.title}>
          Company Chat
        </Typography>
      </Box>
      
      <ChatInterface />
    </div>
  );
};

export default ChatPage;
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  IconButton,
  Badge,
  Avatar,
  CircularProgress,
  Box
} from '@material-ui/core';
import {
  ExpandLess,
  ExpandMore,
  Forum as ForumIcon,
  Announcement as AnnouncementIcon,
  Code as CodeIcon,
  Help as HelpIcon,
  EmojiObjects as EmojiObjectsIcon,
  Description as DescriptionIcon,
  Lock as LockIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
  },
  serverHeader: {
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  serverName: {
    fontWeight: 'bold',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  categoryHeader: {
    padding: theme.spacing(1, 2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: theme.palette.grey[500],
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  channelItem: {
    paddingLeft: theme.spacing(3),
    borderRadius: '0 4px 4px 0',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  activeChannel: {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
  channelIcon: {
    color: theme.palette.grey[500],
    minWidth: theme.spacing(4),
  },
  channelName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  membersSection: {
    marginTop: 'auto',
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  membersList: {
    maxHeight: '200px',
    overflow: 'auto',
  },
  memberItem: {
    paddingLeft: theme.spacing(3),
  },
  memberAvatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    fontSize: '0.8rem',
    backgroundColor: theme.palette.primary.main,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    position: 'absolute',
    bottom: 0,
    right: 0,
    border: `2px solid ${theme.palette.grey[900]}`,
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
}));

// Helper function to get channel icon
const getChannelIcon = (name) => {
  switch (name) {
    case 'announcements':
      return <AnnouncementIcon />;
    case 'general':
      return <ForumIcon />;
    case 'projects':
      return <CodeIcon />;
    case 'help':
      return <HelpIcon />;
    case 'ideas':
      return <EmojiObjectsIcon />;
    case 'resources':
      return <DescriptionIcon />;
    default:
      if (name === 'management' || name.includes('private')) {
        return <LockIcon />;
      }
      return <ForumIcon />;
  }
};

// Helper function to get initials from name
const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
};

const ChatSidebar = ({ loading, server, channels, members, currentChannel, onChannelSelect }) => {
  const classes = useStyles();
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [membersExpanded, setMembersExpanded] = useState(true);
  
  // Group channels by category
  const publicChannels = channels?.filter(channel => !channel.is_private) || [];
  const privateChannels = channels?.filter(channel => channel.is_private) || [];
  
  // Sort members by status and name
  const sortedMembers = [...(members || [])].sort((a, b) => {
    // Online users first
    if (a.status === 'online' && b.status !== 'online') return -1;
    if (a.status !== 'online' && b.status === 'online') return 1;
    
    // Then sort by name
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });
  
  if (loading) {
    return (
      <div className={classes.root}>
        <div className={classes.serverHeader}>
          <Typography variant="h6" className={classes.serverName}>
            Loading...
          </Typography>
        </div>
        <div className={classes.loadingContainer}>
          <CircularProgress color="inherit" />
        </div>
      </div>
    );
  }
  
  if (!server) {
    return (
      <div className={classes.root}>
        <div className={classes.serverHeader}>
          <Typography variant="h6" className={classes.serverName}>
            No Server Available
          </Typography>
        </div>
      </div>
    );
  }
  
  return (
    <div className={classes.root}>
      <div className={classes.serverHeader}>
        <Typography variant="h6" className={classes.serverName}>
          {server.name}
        </Typography>
      </div>
      
      <List>
        <ListItem button onClick={() => setChannelsExpanded(!channelsExpanded)}>
          <ListItemText primary="CHANNELS" />
          {channelsExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={channelsExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {publicChannels.map((channel) => (
              <ListItem
                button
                key={channel.id}
                className={`${classes.channelItem} ${currentChannel?.id === channel.id ? classes.activeChannel : ''}`}
                onClick={() => onChannelSelect(channel)}
              >
                <ListItemIcon className={classes.channelIcon}>
                  {getChannelIcon(channel.name)}
                </ListItemIcon>
                <ListItemText 
                  primary={channel.name} 
                  className={classes.channelName}
                />
              </ListItem>
            ))}
            
            {privateChannels.map((channel) => (
              <ListItem
                button
                key={channel.id}
                className={`${classes.channelItem} ${currentChannel?.id === channel.id ? classes.activeChannel : ''}`}
                onClick={() => onChannelSelect(channel)}
              >
                <ListItemIcon className={classes.channelIcon}>
                  <LockIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={channel.name} 
                  className={classes.channelName}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
      
      <div className={classes.membersSection}>
        <ListItem button onClick={() => setMembersExpanded(!membersExpanded)}>
          <ListItemText primary={`MEMBERS (${members?.length || 0})`} />
          {membersExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        
        <Collapse in={membersExpanded} timeout="auto" unmountOnExit>
          <List className={classes.membersList}>
            {sortedMembers.map((member) => (
              <ListItem button key={member.id} className={classes.memberItem}>
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
        </Collapse>
      </div>
    </div>
  );
};

export default ChatSidebar;
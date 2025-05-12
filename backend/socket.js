/**
 * WebSocket server for real-time chat
 */

const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const db = require('./db');

let io;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.IO instance
 */
const initializeSocketServer = (server) => {
  io = socketIo(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // 60 seconds
    pingInterval: 25000, // 25 seconds
    transports: ['websocket', 'polling']
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Check token expiration
      if (decoded.exp < Date.now() / 1000) {
        return next(new Error('Authentication error: Token expired'));
      }
      
      // Get user from database
      const userResult = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Check if user is active
      if (userResult.rows[0].status !== 'active') {
        return next(new Error('Authentication error: User account is not active'));
      }
      
      // Attach user to socket
      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id} (${socket.user.email})`);
    
    // Update user presence
    updateUserPresence(socket.user.id, 'online');
    
    // Join user's company room
    if (socket.user.company_id) {
      socket.join(`company:${socket.user.company_id}`);
    }
    
    // Handle channel join
    socket.on('channel:join', async (channelId) => {
      try {
        if (!channelId) {
          socket.emit('error', { message: 'Channel ID is required' });
          return;
        }
        
        // Check if channel exists and user has access
        const channelResult = await db.query(
          `SELECT cc.*, cs.company_id
           FROM chat_channels cc
           JOIN chat_servers cs ON cc.server_id = cs.id
           WHERE cc.id = $1`,
          [channelId]
        );
        
        if (channelResult.rows.length === 0) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }
        
        const channel = channelResult.rows[0];
        
        // Check if user belongs to the company
        if (socket.user.company_id !== channel.company_id) {
          socket.emit('error', { message: 'You do not have access to this channel' });
          return;
        }
        
        // Check if channel is private and user is a member
        if (channel.is_private) {
          const memberResult = await db.query(
            `SELECT 1 FROM channel_members
             WHERE channel_id = $1 AND user_id = $2`,
            [channelId, socket.user.id]
          );
          
          if (memberResult.rows.length === 0) {
            socket.emit('error', { message: 'You do not have access to this private channel' });
            return;
          }
        }
        
        // Join channel room
        socket.join(`channel:${channelId}`);
        console.log(`User ${socket.user.id} joined channel ${channelId}`);
        
        // Notify channel about user joining
        socket.to(`channel:${channelId}`).emit('channel:user_joined', {
          channelId,
          user: {
            id: socket.user.id,
            first_name: socket.user.first_name,
            last_name: socket.user.last_name
          }
        });
      } catch (error) {
        console.error('Error joining channel:', error);
        socket.emit('error', { message: 'Error joining channel' });
      }
    });
    
    // Handle channel leave
    socket.on('channel:leave', (channelId) => {
      if (!channelId) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
      }
      
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.user.id} left channel ${channelId}`);
      
      // Notify channel about user leaving
      socket.to(`channel:${channelId}`).emit('channel:user_left', {
        channelId,
        userId: socket.user.id
      });
    });
    
    // Handle message send
    socket.on('message:send', async (data) => {
      try {
        const { channelId, content, parentId } = data;
        
        if (!channelId || !content) {
          socket.emit('error', { message: 'Channel ID and content are required' });
          return;
        }
        
        // Check if channel exists and user has access
        const channelResult = await db.query(
          `SELECT cc.*, cs.company_id
           FROM chat_channels cc
           JOIN chat_servers cs ON cc.server_id = cs.id
           WHERE cc.id = $1`,
          [channelId]
        );
        
        if (channelResult.rows.length === 0) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }
        
        const channel = channelResult.rows[0];
        
        // Check if user belongs to the company
        if (socket.user.company_id !== channel.company_id) {
          socket.emit('error', { message: 'You do not have access to this channel' });
          return;
        }
        
        // Check if channel is private and user is a member
        if (channel.is_private) {
          const memberResult = await db.query(
            `SELECT 1 FROM channel_members
             WHERE channel_id = $1 AND user_id = $2`,
            [channelId, socket.user.id]
          );
          
          if (memberResult.rows.length === 0) {
            socket.emit('error', { message: 'You do not have access to this private channel' });
            return;
          }
        }
        
        // Check if parent message exists and is in the same channel
        if (parentId) {
          const parentResult = await db.query(
            `SELECT 1 FROM messages
             WHERE id = $1 AND channel_id = $2`,
            [parentId, channelId]
          );
          
          if (parentResult.rows.length === 0) {
            socket.emit('error', { message: 'Parent message not found or not in this channel' });
            return;
          }
        }
        
        // Create message
        const messageResult = await db.query(
          `INSERT INTO messages (channel_id, user_id, content, parent_id)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [channelId, socket.user.id, content, parentId]
        );
        
        const message = messageResult.rows[0];
        
        // Get full message with user info
        const fullMessageResult = await db.query(
          `SELECT m.*,
            json_build_object(
              'id', u.id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'email', u.email
            ) as user
           FROM messages m
           JOIN users u ON m.user_id = u.id
           WHERE m.id = $1`,
          [message.id]
        );
        
        const fullMessage = fullMessageResult.rows[0];
        
        // Broadcast message to channel
        io.to(`channel:${channelId}`).emit('message:new', fullMessage);
        
        // Acknowledge message receipt to sender
        socket.emit('message:sent', { id: message.id, timestamp: message.created_at });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });
    
    // Handle message edit
    socket.on('message:edit', async (data) => {
      try {
        const { messageId, content } = data;
        
        if (!messageId || !content) {
          socket.emit('error', { message: 'Message ID and content are required' });
          return;
        }
        
        // Check if message exists and belongs to user
        const messageResult = await db.query(
          `SELECT m.*, cc.server_id
           FROM messages m
           JOIN chat_channels cc ON m.channel_id = cc.id
           WHERE m.id = $1`,
          [messageId]
        );
        
        if (messageResult.rows.length === 0) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        const message = messageResult.rows[0];
        
        // Check if user is the message author or has moderator/admin role
        if (message.user_id !== socket.user.id) {
          // Check if user has permission to edit others' messages
          const userRolesResult = await db.query(
            `SELECT sr.permissions
             FROM server_roles sr
             JOIN user_roles ur ON sr.id = ur.role_id
             WHERE ur.user_id = $1
             AND sr.server_id = $2`,
            [socket.user.id, message.server_id]
          );
          
          const hasPermission = userRolesResult.rows.some(role => 
            role.permissions && role.permissions.manage_messages
          );
          
          if (!hasPermission) {
            socket.emit('error', { message: 'You do not have permission to edit this message' });
            return;
          }
        }
        
        // Update message
        const updatedMessageResult = await db.query(
          `UPDATE messages
           SET content = $1, is_edited = true, updated_at = NOW()
           WHERE id = $2
           RETURNING *`,
          [content, messageId]
        );
        
        // Get full message with user info
        const fullMessageResult = await db.query(
          `SELECT m.*,
            json_build_object(
              'id', u.id,
              'first_name', u.first_name,
              'last_name', u.last_name,
              'email', u.email
            ) as user
           FROM messages m
           JOIN users u ON m.user_id = u.id
           WHERE m.id = $1`,
          [messageId]
        );
        
        const fullMessage = fullMessageResult.rows[0];
        
        // Broadcast updated message to channel
        io.to(`channel:${message.channel_id}`).emit('message:updated', fullMessage);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Error editing message' });
      }
    });
    
    // Handle message delete
    socket.on('message:delete', async (data) => {
      try {
        const { messageId } = data;
        
        if (!messageId) {
          socket.emit('error', { message: 'Message ID is required' });
          return;
        }
        
        // Check if message exists and belongs to user
        const messageResult = await db.query(
          `SELECT m.*, cc.server_id
           FROM messages m
           JOIN chat_channels cc ON m.channel_id = cc.id
           WHERE m.id = $1`,
          [messageId]
        );
        
        if (messageResult.rows.length === 0) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }
        
        const message = messageResult.rows[0];
        
        // Check if user is the message author or has moderator/admin role
        if (message.user_id !== socket.user.id) {
          // Check if user has permission to delete others' messages
          const userRolesResult = await db.query(
            `SELECT sr.permissions
             FROM server_roles sr
             JOIN user_roles ur ON sr.id = ur.role_id
             WHERE ur.user_id = $1
             AND sr.server_id = $2`,
            [socket.user.id, message.server_id]
          );
          
          const hasPermission = userRolesResult.rows.some(role => 
            role.permissions && role.permissions.manage_messages
          );
          
          if (!hasPermission) {
            socket.emit('error', { message: 'You do not have permission to delete this message' });
            return;
          }
        }
        
        // Delete message
        await db.query(
          `DELETE FROM messages
           WHERE id = $1`,
          [messageId]
        );
        
        // Broadcast message deletion to channel
        io.to(`channel:${message.channel_id}`).emit('message:deleted', {
          id: messageId,
          channelId: message.channel_id
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Error deleting message' });
      }
    });
    
    // Handle typing start
    socket.on('typing:start', (data) => {
      const { channelId } = data;
      
      if (!channelId) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
      }
      
      // Broadcast to channel that user is typing
      socket.to(`channel:${channelId}`).emit('user:typing', {
        channelId,
        user: {
          id: socket.user.id,
          first_name: socket.user.first_name,
          last_name: socket.user.last_name
        }
      });
    });
    
    // Handle typing stop
    socket.on('typing:stop', (data) => {
      const { channelId } = data;
      
      if (!channelId) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
      }
      
      // Broadcast to channel that user stopped typing
      socket.to(`channel:${channelId}`).emit('user:stopped-typing', {
        channelId,
        userId: socket.user.id
      });
    });
    
    // Handle presence update
    socket.on('presence:update', async (data) => {
      try {
        const { status } = data;
        
        if (!status || !['online', 'away', 'busy', 'offline'].includes(status)) {
          socket.emit('error', { message: 'Valid status is required' });
          return;
        }
        
        // Update user presence
        await updateUserPresence(socket.user.id, status);
      } catch (error) {
        console.error('Error updating presence:', error);
        socket.emit('error', { message: 'Error updating presence' });
      }
    });
    
    // Handle ping (keep-alive)
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Handle disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`User disconnected: ${socket.user.id}, reason: ${reason}`);
      
      // Update user presence to offline
      await updateUserPresence(socket.user.id, 'offline');
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.id}:`, error);
    });
  });
  
  // Handle server errors
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });
  
  return io;
};

/**
 * Update user presence
 * @param {string} userId - User ID
 * @param {string} status - Status ('online', 'away', 'busy', 'offline')
 */
const updateUserPresence = async (userId, status) => {
  try {
    // Update or insert user presence
    const result = await db.query(
      `INSERT INTO user_presence (user_id, status, last_active, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET status = $2, last_active = NOW(), updated_at = NOW()
       RETURNING *`,
      [userId, status]
    );
    
    const presence = result.rows[0];
    
    // Get user's company
    const userResult = await db.query(
      'SELECT company_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length > 0) {
      const companyId = userResult.rows[0].company_id;
      
      // Broadcast presence update to company
      if (io && companyId) {
        io.to(`company:${companyId}`).emit('user:presence', {
          user_id: userId,
          status,
          last_active: presence.last_active
        });
      }
    }
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
};

/**
 * Get Socket.IO instance
 * @returns {Object} - Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocketServer,
  updateUserPresence,
  getIO
};
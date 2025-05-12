/**
 * Chat Server
 * Real-time chat server using Socket.io
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.io server
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'vishwak',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'property_mapping'
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

// Connected users
const connectedUsers = new Map();

// Socket.io middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', async (socket) => {
  const userId = socket.user.id;
  console.log(`User connected: ${userId}`);
  
  // Add user to connected users
  connectedUsers.set(userId, {
    socket: socket.id,
    status: 'online',
    lastActive: new Date()
  });
  
  try {
    // Update user presence in database
    await pool.query(
      'INSERT INTO user_presence (user_id, status, last_active, updated_at) VALUES ($1, $2, NOW(), NOW()) ' +
      'ON CONFLICT (user_id) DO UPDATE SET status = $2, last_active = NOW(), updated_at = NOW()',
      [userId, 'online']
    );
    
    // Broadcast user presence to all clients
    io.emit('user:presence', {
      user_id: userId,
      status: 'online',
      last_active: new Date()
    });
  } catch (error) {
    console.error('Error updating user presence:', error);
  }
  
  // Join a channel
  socket.on('channel:join', async (channelId) => {
    console.log(`User ${userId} joining channel ${channelId}`);
    
    // Join socket.io room for this channel
    socket.join(`channel:${channelId}`);
    
    try {
      // Check if user is a member of this channel (if it's private)
      const channelResult = await pool.query(
        'SELECT is_private FROM chat_channels WHERE id = $1',
        [channelId]
      );
      
      if (channelResult.rows.length === 0) {
        socket.emit('error', { message: 'Channel not found' });
        return;
      }
      
      const isPrivate = channelResult.rows[0].is_private;
      
      if (isPrivate) {
        const memberResult = await pool.query(
          'SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2',
          [channelId, userId]
        );
        
        if (memberResult.rows.length === 0) {
          socket.emit('error', { message: 'You are not a member of this channel' });
          socket.leave(`channel:${channelId}`);
          return;
        }
      }
      
      // Notify channel that user joined
      io.to(`channel:${channelId}`).emit('channel:user_joined', {
        channel_id: channelId,
        user_id: userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error joining channel:', error);
      socket.emit('error', { message: 'Error joining channel' });
    }
  });
  
  // Leave a channel
  socket.on('channel:leave', (channelId) => {
    console.log(`User ${userId} leaving channel ${channelId}`);
    
    // Leave socket.io room for this channel
    socket.leave(`channel:${channelId}`);
    
    // Notify channel that user left
    io.to(`channel:${channelId}`).emit('channel:user_left', {
      channel_id: channelId,
      user_id: userId,
      timestamp: new Date()
    });
  });
  
  // User starts typing
  socket.on('typing:start', ({ channelId }) => {
    io.to(`channel:${channelId}`).emit('user:typing', {
      channel_id: channelId,
      user_id: userId
    });
  });
  
  // User stops typing
  socket.on('typing:stop', ({ channelId }) => {
    io.to(`channel:${channelId}`).emit('user:stopped-typing', {
      channel_id: channelId,
      user_id: userId
    });
  });
  
  // Update presence status
  socket.on('presence:update', async ({ status }) => {
    if (!['online', 'away', 'busy', 'offline'].includes(status)) {
      status = 'online';
    }
    
    try {
      // Update user presence in database
      await pool.query(
        'UPDATE user_presence SET status = $1, updated_at = NOW() WHERE user_id = $2',
        [status, userId]
      );
      
      // Update connected users map
      if (connectedUsers.has(userId)) {
        connectedUsers.get(userId).status = status;
      }
      
      // Broadcast user presence to all clients
      io.emit('user:presence', {
        user_id: userId,
        status,
        last_active: new Date()
      });
    } catch (error) {
      console.error('Error updating presence status:', error);
    }
  });
  
  // Ping to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
  });
  
  // Disconnect handler
  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${userId}`);
    
    // Remove user from connected users
    connectedUsers.delete(userId);
    
    try {
      // Update user presence in database
      await pool.query(
        'UPDATE user_presence SET status = $1, last_active = NOW(), updated_at = NOW() WHERE user_id = $2',
        ['offline', userId]
      );
      
      // Broadcast user presence to all clients
      io.emit('user:presence', {
        user_id: userId,
        status: 'offline',
        last_active: new Date()
      });
    } catch (error) {
      console.error('Error updating user presence on disconnect:', error);
    }
  });
});

// API Routes

// Get server and channels for user
app.get('/api/chat/servers', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const userId = decoded.id;
    
    // Get user's company
    const userResult = await pool.query(
      'SELECT company_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const companyId = userResult.rows[0].company_id;
    
    // Get company's chat server
    const serverResult = await pool.query(
      'SELECT * FROM chat_servers WHERE company_id = $1',
      [companyId]
    );
    
    if (serverResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Chat server not found' });
    }
    
    const server = serverResult.rows[0];
    
    // Get channels for this server
    const channelsResult = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM messages WHERE channel_id = c.id) as message_count
       FROM chat_channels c
       WHERE c.server_id = $1
       AND (c.is_private = false OR EXISTS (
         SELECT 1 FROM channel_members WHERE channel_id = c.id AND user_id = $2
       ))
       ORDER BY c.name`,
      [server.id, userId]
    );
    
    // Get members (users in the same company)
    const membersResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
        p.status, p.last_active
       FROM users u
       LEFT JOIN user_presence p ON u.id = p.user_id
       WHERE u.company_id = $1
       ORDER BY u.first_name, u.last_name`,
      [companyId]
    );
    
    res.json({
      success: true,
      data: {
        server,
        channels: channelsResult.rows,
        members: membersResult.rows
      }
    });
  } catch (error) {
    console.error('Error getting chat server:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get messages for a channel
app.get('/api/chat/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const userId = decoded.id;
    
    // Check if channel exists and user has access
    const channelResult = await pool.query(
      'SELECT * FROM chat_channels WHERE id = $1',
      [channelId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    const channel = channelResult.rows[0];
    
    // If channel is private, check if user is a member
    if (channel.is_private) {
      const memberResult = await pool.query(
        'SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2',
        [channelId, userId]
      );
      
      if (memberResult.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'You are not a member of this channel' });
      }
    }
    
    // Get messages for this channel
    let query = `
      SELECT m.*, u.first_name, u.last_name, u.email, u.role
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.channel_id = $1
    `;
    
    const queryParams = [channelId];
    
    if (before) {
      query += ' AND m.id < $2';
      queryParams.push(before);
    }
    
    query += ' ORDER BY m.created_at DESC LIMIT $' + (queryParams.length + 1);
    queryParams.push(limit);
    
    const messagesResult = await pool.query(query, queryParams);
    
    // Format messages
    const messages = messagesResult.rows.map(row => {
      const { first_name, last_name, email, role, ...message } = row;
      return {
        ...message,
        user: {
          id: message.user_id,
          first_name,
          last_name,
          email,
          role
        }
      };
    });
    
    // Update read receipt
    await pool.query(
      `INSERT INTO read_receipts (channel_id, user_id, last_read_message_id, last_read_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (channel_id, user_id) 
       DO UPDATE SET last_read_message_id = $3, last_read_at = NOW()`,
      [channelId, userId, messages[0]?.id]
    );
    
    res.json({
      success: true,
      data: messages.reverse() // Reverse to get chronological order
    });
  } catch (error) {
    console.error('Error getting channel messages:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Send a message
app.post('/api/chat/channels/:channelId/messages', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { content, parent_id } = req.body;
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const userId = decoded.id;
    
    // Check if channel exists and user has access
    const channelResult = await pool.query(
      'SELECT * FROM chat_channels WHERE id = $1',
      [channelId]
    );
    
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    const channel = channelResult.rows[0];
    
    // If channel is private, check if user is a member
    if (channel.is_private) {
      const memberResult = await pool.query(
        'SELECT * FROM channel_members WHERE channel_id = $1 AND user_id = $2',
        [channelId, userId]
      );
      
      if (memberResult.rows.length === 0) {
        return res.status(403).json({ success: false, error: 'You are not a member of this channel' });
      }
    }
    
    // Insert message
    const messageResult = await pool.query(
      `INSERT INTO messages (channel_id, user_id, content, parent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [channelId, userId, content, parent_id]
    );
    
    const message = messageResult.rows[0];
    
    // Get user info
    const userResult = await pool.query(
      'SELECT first_name, last_name, email, role FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    
    // Format message with user info
    const formattedMessage = {
      ...message,
      user: {
        id: userId,
        ...user
      }
    };
    
    // Broadcast message to channel
    io.to(`channel:${channelId}`).emit('message:new', formattedMessage);
    
    res.json({
      success: true,
      data: formattedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Edit a message
app.put('/api/chat/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const userId = decoded.id;
    
    // Check if message exists and belongs to user
    const messageResult = await pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    const message = messageResult.rows[0];
    
    if (message.user_id !== userId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
    }
    
    // Update message
    const updateResult = await pool.query(
      `UPDATE messages 
       SET content = $1, is_edited = true, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [content, messageId]
    );
    
    const updatedMessage = updateResult.rows[0];
    
    // Get user info
    const userResult = await pool.query(
      'SELECT first_name, last_name, email, role FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    
    // Format message with user info
    const formattedMessage = {
      ...updatedMessage,
      user: {
        id: userId,
        ...user
      }
    };
    
    // Broadcast updated message to channel
    io.to(`channel:${message.channel_id}`).emit('message:updated', formattedMessage);
    
    res.json({
      success: true,
      data: formattedMessage
    });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Delete a message
app.delete('/api/chat/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    const userId = decoded.id;
    
    // Check if message exists and belongs to user
    const messageResult = await pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [messageId]
    );
    
    if (messageResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }
    
    const message = messageResult.rows[0];
    
    // Check if user is message author or admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    const isAdmin = userResult.rows[0]?.role === 'admin';
    
    if (message.user_id !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'You can only delete your own messages' });
    }
    
    // Delete message
    await pool.query(
      'DELETE FROM messages WHERE id = $1',
      [messageId]
    );
    
    // Broadcast deletion to channel
    io.to(`channel:${message.channel_id}`).emit('message:deleted', {
      id: messageId,
      channel_id: message.channel_id
    });
    
    res.json({
      success: true,
      data: { id: messageId }
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.CHAT_PORT || 5001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});
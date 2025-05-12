/**
 * Chat API Routes
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const auth = require('../middleware/auth');
const db = require('../db');
const errorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

/**
 * @route   GET /api/chat/servers
 * @desc    Get all chat servers for the user's company
 * @access  Private
 */
router.get('/servers', auth.protect, asyncHandler(async function(req, res) {
  // Get user's company ID
  const companyId = req.user.company_id;
  
  if (!companyId) {
    return res.status(400).json({
      success: false,
      error: 'User is not associated with a company'
    });
  }
  
  // Get chat server for the company
  const serverResult = await db.query(
    `SELECT cs.*, c.name as company_name
     FROM chat_servers cs
     JOIN companies c ON cs.company_id = c.id
     WHERE cs.company_id = $1`,
    [companyId]
  );
  
  if (serverResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'No chat server found for this company'
    });
  }
  
  const server = serverResult.rows[0];
  
  // Get channels for this server
  const channelsResult = await db.query(
    `SELECT cc.*,
      (SELECT COUNT(*) FROM messages m WHERE m.channel_id = cc.id) as message_count
     FROM chat_channels cc
     WHERE cc.server_id = $1
     AND (cc.is_private = false OR EXISTS (
       SELECT 1 FROM channel_members cm WHERE cm.channel_id = cc.id AND cm.user_id = $2
     ))
     ORDER BY cc.name`,
    [server.id, req.user.id]
  );
  
  // Get user roles for this server
  const rolesResult = await db.query(
    `SELECT sr.*
     FROM server_roles sr
     JOIN user_roles ur ON sr.id = ur.role_id
     WHERE ur.user_id = $1
     AND sr.server_id = $2`,
    [req.user.id, server.id]
  );
  
  // Get all members of this server (company)
  const membersResult = await db.query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role,
      up.status, up.last_active,
      json_agg(json_build_object('id', sr.id, 'name', sr.name, 'color', sr.color)) as roles
     FROM users u
     LEFT JOIN user_presence up ON u.id = up.user_id
     LEFT JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN server_roles sr ON ur.role_id = sr.id AND sr.server_id = $1
     WHERE u.company_id = $2
     GROUP BY u.id, u.first_name, u.last_name, u.email, u.role, up.status, up.last_active
     ORDER BY u.first_name, u.last_name`,
    [server.id, companyId]
  );
  
  // Return server with channels, roles, and members
  res.json({
    success: true,
    data: {
      server,
      channels: channelsResult.rows,
      roles: rolesResult.rows,
      members: membersResult.rows
    }
  });
}));

/**
 * @route   GET /api/chat/channels/:channelId/messages
 * @desc    Get messages for a channel
 * @access  Private
 */
router.get('/channels/:channelId/messages', [
  auth.protect,
  param('channelId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('before').optional().isUUID(),
], asyncHandler(async function(req, res) {
  const channelId = req.params.channelId;
  const limit = req.query.limit || 50;
  const beforeId = req.query.before;
  
  // Check if user has access to this channel
  const channelResult = await db.query(
    `SELECT cc.*, cs.company_id
     FROM chat_channels cc
     JOIN chat_servers cs ON cc.server_id = cs.id
     WHERE cc.id = $1`,
    [channelId]
  );
  
  if (channelResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Channel not found'
    });
  }
  
  const channel = channelResult.rows[0];
  
  // Check if user belongs to the company
  if (req.user.company_id !== channel.company_id) {
    return res.status(403).json({
      success: false,
      error: 'You do not have access to this channel'
    });
  }
  
  // Check if channel is private and user is a member
  if (channel.is_private) {
    const memberResult = await db.query(
      `SELECT 1 FROM channel_members
       WHERE channel_id = $1 AND user_id = $2`,
      [channelId, req.user.id]
    );
    
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this private channel'
      });
    }
  }
  
  // Get messages
  let messagesQuery = `
    SELECT m.*,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email
      ) as user,
      (SELECT json_agg(
        json_build_object(
          'id', ma.id,
          'file_name', ma.file_name,
          'file_type', ma.file_type,
          'file_size', ma.file_size,
          'file_url', ma.file_url
        )
      ) FROM message_attachments ma WHERE ma.message_id = m.id) as attachments,
      (SELECT json_agg(
        json_build_object(
          'emoji', mr.emoji,
          'user_id', mr.user_id
        )
      ) FROM message_reactions mr WHERE mr.message_id = m.id) as reactions
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.channel_id = $1
  `;
  
  const queryParams = [channelId];
  
  if (beforeId) {
    messagesQuery += ` AND m.id < $2`;
    queryParams.push(beforeId);
  }
  
  messagesQuery += `
    ORDER BY m.created_at DESC
    LIMIT $${queryParams.length + 1}
  `;
  queryParams.push(limit);
  
  const messagesResult = await db.query(messagesQuery, queryParams);
  
  // Update read receipt
  if (messagesResult.rows.length > 0) {
    const latestMessage = messagesResult.rows[0];
    
    await db.query(
      `INSERT INTO read_receipts (channel_id, user_id, last_read_message_id, last_read_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (channel_id, user_id)
       DO UPDATE SET last_read_message_id = $3, last_read_at = NOW()`,
      [channelId, req.user.id, latestMessage.id]
    );
  }
  
  res.json({
    success: true,
    data: messagesResult.rows.reverse() // Return in chronological order
  });
}));

/**
 * @route   POST /api/chat/channels/:channelId/messages
 * @desc    Create a new message in a channel
 * @access  Private
 */
router.post('/channels/:channelId/messages', [
  auth.protect,
  param('channelId').isUUID(),
  body('content').isString().trim().notEmpty().withMessage('Message content is required'),
  body('parent_id').optional().isUUID(),
], asyncHandler(async function(req, res) {
  const channelId = req.params.channelId;
  const { content, parent_id } = req.body;
  
  // Check if user has access to this channel
  const channelResult = await db.query(
    `SELECT cc.*, cs.company_id
     FROM chat_channels cc
     JOIN chat_servers cs ON cc.server_id = cs.id
     WHERE cc.id = $1`,
    [channelId]
  );
  
  if (channelResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Channel not found'
    });
  }
  
  const channel = channelResult.rows[0];
  
  // Check if user belongs to the company
  if (req.user.company_id !== channel.company_id) {
    return res.status(403).json({
      success: false,
      error: 'You do not have access to this channel'
    });
  }
  
  // Check if channel is private and user is a member
  if (channel.is_private) {
    const memberResult = await db.query(
      `SELECT 1 FROM channel_members
       WHERE channel_id = $1 AND user_id = $2`,
      [channelId, req.user.id]
    );
    
    if (memberResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this private channel'
      });
    }
  }
  
  // Check if parent message exists and is in the same channel
  if (parent_id) {
    const parentResult = await db.query(
      `SELECT 1 FROM messages
       WHERE id = $1 AND channel_id = $2`,
      [parent_id, channelId]
    );
    
    if (parentResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Parent message not found or not in this channel'
      });
    }
  }
  
  // Create message
  const messageResult = await db.query(
    `INSERT INTO messages (channel_id, user_id, content, parent_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [channelId, req.user.id, content, parent_id]
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
  
  res.status(201).json({
    success: true,
    data: fullMessageResult.rows[0]
  });
}));

/**
 * @route   PUT /api/chat/messages/:messageId
 * @desc    Edit a message
 * @access  Private
 */
router.put('/messages/:messageId', [
  auth.protect,
  param('messageId').isUUID(),
  body('content').isString().trim().notEmpty().withMessage('Message content is required'),
], asyncHandler(async function(req, res) {
  const messageId = req.params.messageId;
  const { content } = req.body;
  
  // Check if message exists and belongs to user
  const messageResult = await db.query(
    `SELECT m.*, cc.server_id
     FROM messages m
     JOIN chat_channels cc ON m.channel_id = cc.id
     WHERE m.id = $1`,
    [messageId]
  );
  
  if (messageResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }
  
  const message = messageResult.rows[0];
  
  // Check if user is the message author or has moderator/admin role
  if (message.user_id !== req.user.id) {
    // Check if user has permission to edit others' messages
    const userRolesResult = await db.query(
      `SELECT sr.permissions
       FROM server_roles sr
       JOIN user_roles ur ON sr.id = ur.role_id
       WHERE ur.user_id = $1
       AND sr.server_id = $2`,
      [req.user.id, message.server_id]
    );
    
    const hasPermission = userRolesResult.rows.some(role => 
      role.permissions && role.permissions.manage_messages
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this message'
      });
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
  
  res.json({
    success: true,
    data: fullMessageResult.rows[0]
  });
}));

/**
 * @route   DELETE /api/chat/messages/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/messages/:messageId', [
  auth.protect,
  param('messageId').isUUID(),
], asyncHandler(async function(req, res) {
  const messageId = req.params.messageId;
  
  // Check if message exists and belongs to user
  const messageResult = await db.query(
    `SELECT m.*, cc.server_id
     FROM messages m
     JOIN chat_channels cc ON m.channel_id = cc.id
     WHERE m.id = $1`,
    [messageId]
  );
  
  if (messageResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Message not found'
    });
  }
  
  const message = messageResult.rows[0];
  
  // Check if user is the message author or has moderator/admin role
  if (message.user_id !== req.user.id) {
    // Check if user has permission to delete others' messages
    const userRolesResult = await db.query(
      `SELECT sr.permissions
       FROM server_roles sr
       JOIN user_roles ur ON sr.id = ur.role_id
       WHERE ur.user_id = $1
       AND sr.server_id = $2`,
      [req.user.id, message.server_id]
    );
    
    const hasPermission = userRolesResult.rows.some(role => 
      role.permissions && role.permissions.manage_messages
    );
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this message'
      });
    }
  }
  
  // Delete message
  await db.query(
    `DELETE FROM messages
     WHERE id = $1`,
    [messageId]
  );
  
  res.json({
    success: true,
    data: {}
  });
}));

/**
 * @route   POST /api/chat/channels
 * @desc    Create a new channel
 * @access  Private
 */
router.post('/channels', [
  auth.protect,
  body('server_id').isUUID(),
  body('name').isString().trim().notEmpty().withMessage('Channel name is required')
    .matches(/^[a-z0-9-_]+$/).withMessage('Channel name can only contain lowercase letters, numbers, hyphens, and underscores'),
  body('description').optional().isString(),
  body('is_private').optional().isBoolean(),
], asyncHandler(async function(req, res) {
  const { server_id, name, description, is_private } = req.body;
  
  // Check if server exists and user has access
  const serverResult = await db.query(
    `SELECT cs.*, c.id as company_id
     FROM chat_servers cs
     JOIN companies c ON cs.company_id = c.id
     WHERE cs.id = $1`,
    [server_id]
  );
  
  if (serverResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'Server not found'
    });
  }
  
  const server = serverResult.rows[0];
  
  // Check if user belongs to the company
  if (req.user.company_id !== server.company_id) {
    return res.status(403).json({
      success: false,
      error: 'You do not have access to this server'
    });
  }
  
  // Check if user has permission to create channels
  const userRolesResult = await db.query(
    `SELECT sr.permissions
     FROM server_roles sr
     JOIN user_roles ur ON sr.id = ur.role_id
     WHERE ur.user_id = $1
     AND sr.server_id = $2`,
    [req.user.id, server_id]
  );
  
  const hasPermission = userRolesResult.rows.some(role => 
    role.permissions && role.permissions.manage_channels
  );
  
  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      error: 'You do not have permission to create channels'
    });
  }
  
  // Check if channel name already exists
  const existingChannelResult = await db.query(
    `SELECT 1 FROM chat_channels
     WHERE server_id = $1 AND name = $2`,
    [server_id, name]
  );
  
  if (existingChannelResult.rows.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Channel with this name already exists'
    });
  }
  
  // Create channel
  const channelResult = await db.query(
    `INSERT INTO chat_channels (server_id, name, description, is_private, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [server_id, name, description || '', is_private || false, req.user.id]
  );
  
  const channel = channelResult.rows[0];
  
  // If private channel, add creator as member
  if (is_private) {
    await db.query(
      `INSERT INTO channel_members (channel_id, user_id)
       VALUES ($1, $2)`,
      [channel.id, req.user.id]
    );
  }
  
  res.status(201).json({
    success: true,
    data: channel
  });
}));

/**
 * @route   GET /api/chat/direct-messages
 * @desc    Get all direct message channels for the user
 * @access  Private
 */
router.get('/direct-messages', auth.protect, asyncHandler(async function(req, res) {
  // Get all DM channels where user is a participant
  const channelsResult = await db.query(
    `SELECT dmc.*,
      (
        SELECT json_agg(json_build_object(
          'id', u.id,
          'first_name', u.first_name,
          'last_name', u.last_name,
          'email', u.email,
          'status', up.status
        ))
        FROM direct_message_participants dmp
        JOIN users u ON dmp.user_id = u.id
        LEFT JOIN user_presence up ON u.id = up.user_id
        WHERE dmp.channel_id = dmc.id AND dmp.user_id != $1
      ) as participants,
      (
        SELECT dm.content
        FROM direct_messages dm
        WHERE dm.channel_id = dmc.id
        ORDER BY dm.created_at DESC
        LIMIT 1
      ) as last_message,
      (
        SELECT dm.created_at
        FROM direct_messages dm
        WHERE dm.channel_id = dmc.id
        ORDER BY dm.created_at DESC
        LIMIT 1
      ) as last_activity
     FROM direct_message_channels dmc
     JOIN direct_message_participants dmp ON dmc.id = dmp.channel_id
     WHERE dmp.user_id = $1
     ORDER BY last_activity DESC NULLS LAST`,
    [req.user.id]
  );
  
  res.json({
    success: true,
    data: channelsResult.rows
  });
}));

/**
 * @route   POST /api/chat/direct-messages
 * @desc    Create a new direct message channel or get existing one
 * @access  Private
 */
router.post('/direct-messages', [
  auth.protect,
  body('user_id').isUUID().withMessage('User ID is required'),
], asyncHandler(async function(req, res) {
  const { user_id } = req.body;
  
  // Check if target user exists
  const userResult = await db.query(
    `SELECT id, first_name, last_name, email, company_id
     FROM users
     WHERE id = $1`,
    [user_id]
  );
  
  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  const targetUser = userResult.rows[0];
  
  // Check if DM channel already exists between these users
  const existingChannelResult = await db.query(
    `SELECT dmc.id
     FROM direct_message_channels dmc
     JOIN direct_message_participants dmp1 ON dmc.id = dmp1.channel_id
     JOIN direct_message_participants dmp2 ON dmc.id = dmp2.channel_id
     WHERE dmp1.user_id = $1 AND dmp2.user_id = $2`,
    [req.user.id, user_id]
  );
  
  let channelId;
  
  if (existingChannelResult.rows.length > 0) {
    // Use existing channel
    channelId = existingChannelResult.rows[0].id;
  } else {
    // Create new channel
    const newChannelResult = await db.query(
      `INSERT INTO direct_message_channels DEFAULT VALUES RETURNING id`,
      []
    );
    
    channelId = newChannelResult.rows[0].id;
    
    // Add participants
    await db.query(
      `INSERT INTO direct_message_participants (channel_id, user_id)
       VALUES ($1, $2), ($1, $3)`,
      [channelId, req.user.id, user_id]
    );
  }
  
  // Get channel with messages
  const channelResult = await db.query(
    `SELECT dmc.*,
      json_agg(json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email
      )) as participants
     FROM direct_message_channels dmc
     JOIN direct_message_participants dmp ON dmc.id = dmp.channel_id
     JOIN users u ON dmp.user_id = u.id
     WHERE dmc.id = $1
     GROUP BY dmc.id`,
    [channelId]
  );
  
  // Get messages
  const messagesResult = await db.query(
    `SELECT dm.*,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email
      ) as sender
     FROM direct_messages dm
     JOIN users u ON dm.sender_id = u.id
     WHERE dm.channel_id = $1
     ORDER BY dm.created_at DESC
     LIMIT 50`,
    [channelId]
  );
  
  res.json({
    success: true,
    data: {
      channel: channelResult.rows[0],
      messages: messagesResult.rows.reverse() // Return in chronological order
    }
  });
}));

/**
 * @route   POST /api/chat/direct-messages/:channelId
 * @desc    Send a direct message
 * @access  Private
 */
router.post('/direct-messages/:channelId', [
  auth.protect,
  param('channelId').isUUID(),
  body('content').isString().trim().notEmpty().withMessage('Message content is required'),
], asyncHandler(async function(req, res) {
  const channelId = req.params.channelId;
  const { content } = req.body;
  
  // Check if user is a participant in this channel
  const participantResult = await db.query(
    `SELECT 1 FROM direct_message_participants
     WHERE channel_id = $1 AND user_id = $2`,
    [channelId, req.user.id]
  );
  
  if (participantResult.rows.length === 0) {
    return res.status(403).json({
      success: false,
      error: 'You are not a participant in this conversation'
    });
  }
  
  // Create message
  const messageResult = await db.query(
    `INSERT INTO direct_messages (channel_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [channelId, req.user.id, content]
  );
  
  const message = messageResult.rows[0];
  
  // Get full message with sender info
  const fullMessageResult = await db.query(
    `SELECT dm.*,
      json_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email
      ) as sender
     FROM direct_messages dm
     JOIN users u ON dm.sender_id = u.id
     WHERE dm.id = $1`,
    [message.id]
  );
  
  res.status(201).json({
    success: true,
    data: fullMessageResult.rows[0]
  });
}));

/**
 * @route   PUT /api/chat/user-presence
 * @desc    Update user presence status
 * @access  Private
 */
router.put('/user-presence', [
  auth.protect,
  body('status').isIn(['online', 'away', 'busy', 'offline']).withMessage('Invalid status'),
], asyncHandler(async function(req, res) {
  const { status } = req.body;
  
  // Update or insert user presence
  await db.query(
    `INSERT INTO user_presence (user_id, status, last_active, updated_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET status = $2, last_active = NOW(), updated_at = NOW()`,
    [req.user.id, status]
  );
  
  res.json({
    success: true,
    data: {
      user_id: req.user.id,
      status,
      last_active: new Date()
    }
  });
}));

module.exports = router;
# Discord-like Chat System for Property Mapping Platform

This document provides an overview of the Discord-like chat system implementation for the Property Mapping Platform.

## Overview

The chat system allows companies to have their own private chat servers where employees can communicate. Each company automatically gets a chat server when created, and the company admin becomes the server admin.

### Key Features

- **Company-based Chat Servers**: Each company has its own private chat server
- **Channels**: Multiple channels for different topics (general, announcements, etc.)
- **Private Channels**: Restricted access channels for specific team members
- **Direct Messages**: Private conversations between users
- **Roles & Permissions**: Admin, moderator, and member roles with different permissions
- **Message History**: Persistent message history that remains after logout
- **Reactions**: Emoji reactions to messages
- **Attachments**: File uploads in messages
- **Presence**: User online status indicators

## Database Schema

The chat system uses the following database tables:

- `chat_servers`: One per company
- `chat_channels`: Multiple channels per server
- `channel_members`: For private channel access control
- `server_roles`: Role definitions with permissions
- `user_roles`: Assigns roles to users
- `messages`: Channel messages
- `message_attachments`: Files attached to messages
- `message_reactions`: Emoji reactions to messages
- `user_presence`: Online status tracking
- `read_receipts`: Tracks which messages users have read
- `direct_message_channels`: For private conversations
- `direct_message_participants`: Users in direct message conversations
- `direct_messages`: Messages in direct conversations
- `notifications`: System notifications
- `user_channel_settings`: User preferences for channels

## API Endpoints

### Server & Channels

- `GET /api/chat/servers`: Get user's company chat server with channels
- `POST /api/chat/channels`: Create a new channel
- `PUT /api/chat/channels/:channelId`: Update a channel
- `DELETE /api/chat/channels/:channelId`: Delete a channel

### Messages

- `GET /api/chat/channels/:channelId/messages`: Get channel messages
- `POST /api/chat/channels/:channelId/messages`: Send a message
- `PUT /api/chat/messages/:messageId`: Edit a message
- `DELETE /api/chat/messages/:messageId`: Delete a message
- `POST /api/chat/messages/:messageId/reactions`: Add a reaction
- `DELETE /api/chat/messages/:messageId/reactions/:emoji`: Remove a reaction

### Direct Messages

- `GET /api/chat/direct-messages`: Get user's direct message conversations
- `POST /api/chat/direct-messages`: Create/get a direct message channel
- `GET /api/chat/direct-messages/:channelId`: Get direct messages
- `POST /api/chat/direct-messages/:channelId`: Send a direct message

### User Presence

- `PUT /api/chat/user-presence`: Update user's online status

## Implementation Details

### Automatic Server Creation

When a company is created, a chat server is automatically created for it:

```sql
CREATE OR REPLACE FUNCTION create_default_chat_server()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a chat server for the company
    INSERT INTO chat_servers (company_id, name, description)
    VALUES (NEW.id, NEW.name || ' Chat Server', 'Company chat server for ' || NEW.name);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create chat server when a company is created
CREATE TRIGGER create_company_chat_server
AFTER INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION create_default_chat_server();
```

### Default Channels

Each server gets default channels automatically:

```sql
CREATE OR REPLACE FUNCTION create_default_channels()
RETURNS TRIGGER AS $$
BEGIN
    -- Create general channel
    INSERT INTO chat_channels (server_id, name, description)
    VALUES (NEW.id, 'general', 'General discussion');
    
    -- Create announcements channel
    INSERT INTO chat_channels (server_id, name, description)
    VALUES (NEW.id, 'announcements', 'Company announcements');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Role-Based Permissions

The system uses a role-based permission system:

```json
{
  "manage_channels": true,
  "manage_roles": true,
  "manage_messages": true,
  "manage_server": true
}
```

## Frontend Integration

The chat system integrates with the frontend using:

1. **React Components**: Chat UI components
2. **Redux State**: For managing chat state
3. **WebSockets**: For real-time message delivery
4. **API Services**: For fetching and sending data

## Getting Started

### Run Database Migrations

```bash
python database/db_manager.py migrate
```

### Seed Test Data

```bash
python database/seed_chat_data.py
```

### Register Chat Routes

In `server.js`, add:

```javascript
// Chat routes
app.use('/api/chat', require('./routes/chat'));
```

## Security Considerations

- All chat endpoints require authentication
- Users can only access their company's chat server
- Private channels require explicit membership
- Role-based permissions control administrative actions
- Messages are associated with the sender for accountability
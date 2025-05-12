-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Chat System Migration for Property Mapping Platform
-- This migration adds tables for a Discord-like chat system

-- Chat Servers (one per company)
CREATE TABLE IF NOT EXISTS chat_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id)
);

-- Chat Channels (multiple per server)
CREATE TABLE IF NOT EXISTS chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES chat_servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, name)
);

-- Channel Members (for private channels)
CREATE TABLE IF NOT EXISTS channel_members (
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (channel_id, user_id)
);

-- Server Roles
CREATE TABLE IF NOT EXISTS server_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES chat_servers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(server_id, name)
);

-- User Roles (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES server_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    parent_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Message Attachments
CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id, user_id, emoji)
);

-- User Presence Status
CREATE TABLE IF NOT EXISTS user_presence (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    last_active TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Read Receipts
CREATE TABLE IF NOT EXISTS read_receipts (
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    last_read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (channel_id, user_id)
);

-- Direct Message Channels
CREATE TABLE IF NOT EXISTS direct_message_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Direct Message Participants
CREATE TABLE IF NOT EXISTS direct_message_participants (
    channel_id UUID NOT NULL REFERENCES direct_message_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (channel_id, user_id)
);

-- Direct Messages
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES direct_message_channels(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Channel Settings
CREATE TABLE IF NOT EXISTS user_channel_settings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    notification_preference VARCHAR(20) NOT NULL DEFAULT 'all',
    PRIMARY KEY (user_id, channel_id)
);

-- Create indexes for performance
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_direct_message_participants_user_id ON direct_message_participants(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_chat_servers_updated_at
BEFORE UPDATE ON chat_servers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON chat_channels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_server_roles_updated_at
BEFORE UPDATE ON server_roles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_presence_updated_at
BEFORE UPDATE ON user_presence
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON direct_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default admin role function
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

-- Function to create default channels when a server is created
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

-- Trigger to create default channels when a server is created
CREATE TRIGGER create_server_default_channels
AFTER INSERT ON chat_servers
FOR EACH ROW EXECUTE FUNCTION create_default_channels();

-- Function to create default roles when a server is created
CREATE OR REPLACE FUNCTION create_default_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Create admin role
    INSERT INTO server_roles (server_id, name, color, permissions)
    VALUES (NEW.id, 'Admin', '#FF0000', '{"manage_channels": true, "manage_roles": true, "manage_messages": true, "manage_server": true}');
    
    -- Create moderator role
    INSERT INTO server_roles (server_id, name, color, permissions)
    VALUES (NEW.id, 'Moderator', '#00FF00', '{"manage_messages": true, "pin_messages": true}');
    
    -- Create member role
    INSERT INTO server_roles (server_id, name, color, permissions)
    VALUES (NEW.id, 'Member', '#0000FF', '{"send_messages": true, "read_messages": true}');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default roles when a server is created
CREATE TRIGGER create_server_default_roles
AFTER INSERT ON chat_servers
FOR EACH ROW EXECUTE FUNCTION create_default_roles();

-- Function to assign company admin to admin role
CREATE OR REPLACE FUNCTION assign_company_admin_role()
RETURNS TRIGGER AS $$
DECLARE
    admin_user_id UUID;
    admin_role_id UUID;
BEGIN
    -- Find the company admin user
    SELECT id INTO admin_user_id FROM users WHERE company_id = NEW.company_id AND role = 'admin' LIMIT 1;
    
    -- Find the admin role for this server
    SELECT id INTO admin_role_id FROM server_roles WHERE server_id = NEW.id AND name = 'Admin' LIMIT 1;
    
    -- Assign admin role to company admin if both exist
    IF admin_user_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES (admin_user_id, admin_role_id, admin_user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign company admin to admin role when a server is created
CREATE TRIGGER assign_server_admin_role
AFTER INSERT ON chat_servers
FOR EACH ROW EXECUTE FUNCTION assign_company_admin_role();
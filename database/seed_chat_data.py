#!/usr/bin/env python3
"""
Chat System Seed Script for Property Mapping Platform
----------------------------------------------------
This script seeds the chat system database with test data.
"""

import os
import sys
import random
import uuid
import datetime
import psycopg2
from psycopg2.extras import register_uuid
from dotenv import load_dotenv
import faker

# Load environment variables from .env file
load_dotenv()

# Initialize faker for generating test data
fake = faker.Faker()

# Database configuration
DB_CONFIG = {
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'vishwak'),
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'property_mapping')
}

def connect_to_db():
    """Connect to the database"""
    try:
        # Create connection
        conn = psycopg2.connect(
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database']
        )
        
        # Register UUID type
        register_uuid()
        
        # Create cursor
        cursor = conn.cursor()
        
        print(f"Connected to database: {DB_CONFIG['database']}")
        return conn, cursor
    except psycopg2.Error as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def close_db_connection(conn, cursor):
    """Close database connection"""
    if cursor:
        cursor.close()
    if conn:
        conn.close()
        print("Database connection closed")

def seed_chat_data():
    """Seed chat system with test data"""
    conn, cursor = connect_to_db()
    
    try:
        # Check if chat_servers table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'chat_servers'
            )
        """)
        
        if not cursor.fetchone()[0]:
            print("Chat system tables don't exist. Run the migration first.")
            close_db_connection(conn, cursor)
            return
        
        # Get companies
        cursor.execute("SELECT id, name FROM companies")
        companies = cursor.fetchall()
        
        if not companies:
            print("No companies found. Seed companies first.")
            close_db_connection(conn, cursor)
            return
        
        # Get users
        cursor.execute("SELECT id, first_name, last_name, email, company_id FROM users")
        users = cursor.fetchall()
        
        if not users:
            print("No users found. Seed users first.")
            close_db_connection(conn, cursor)
            return
        
        # Create chat servers for companies that don't have one
        for company_id, company_name in companies:
            cursor.execute("SELECT id FROM chat_servers WHERE company_id = %s", (company_id,))
            if not cursor.fetchone():
                server_id = uuid.uuid4()
                cursor.execute("""
                    INSERT INTO chat_servers (id, company_id, name, description)
                    VALUES (%s, %s, %s, %s)
                """, (server_id, company_id, f"{company_name} Chat Server", f"Company chat server for {company_name}"))
                print(f"Created chat server for {company_name}")
        
        # Get all chat servers
        cursor.execute("SELECT id, company_id, name FROM chat_servers")
        servers = cursor.fetchall()
        
        # For each server, create additional channels
        for server_id, company_id, server_name in servers:
            # Create additional channels
            channel_types = ['projects', 'random', 'help', 'ideas', 'resources']
            
            for channel_type in channel_types:
                # Check if channel already exists
                cursor.execute("SELECT id FROM chat_channels WHERE server_id = %s AND name = %s", (server_id, channel_type))
                if not cursor.fetchone():
                    channel_id = uuid.uuid4()
                    cursor.execute("""
                        INSERT INTO chat_channels (id, server_id, name, description)
                        VALUES (%s, %s, %s, %s)
                    """, (channel_id, server_id, channel_type, f"{channel_type.capitalize()} discussion channel"))
                    print(f"Created {channel_type} channel for {server_name}")
            
            # Create a private channel
            cursor.execute("SELECT id FROM chat_channels WHERE server_id = %s AND name = %s", (server_id, 'management'))
            if not cursor.fetchone():
                channel_id = uuid.uuid4()
                cursor.execute("""
                    INSERT INTO chat_channels (id, server_id, name, description, is_private)
                    VALUES (%s, %s, %s, %s, %s)
                """, (channel_id, server_id, 'management', 'Private channel for management', True))
                print(f"Created private management channel for {server_name}")
            
            # Get company users
            company_users = [user for user in users if user[4] == company_id]
            
            if not company_users:
                continue
            
            # Get channels for this server
            cursor.execute("SELECT id, name FROM chat_channels WHERE server_id = %s", (server_id,))
            channels = cursor.fetchall()
            
            # Get roles for this server
            cursor.execute("SELECT id, name FROM server_roles WHERE server_id = %s", (server_id,))
            roles = cursor.fetchall()
            
            # Assign roles to users
            admin_role = next((role_id for role_id, role_name in roles if role_name == 'Admin'), None)
            mod_role = next((role_id for role_id, role_name in roles if role_name == 'Moderator'), None)
            member_role = next((role_id for role_id, role_name in roles if role_name == 'Member'), None)
            
            if admin_role and mod_role and member_role:
                # Assign admin role to first user
                if company_users:
                    admin_user = company_users[0]
                    cursor.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES (%s, %s)
                        ON CONFLICT (user_id, role_id) DO NOTHING
                    """, (admin_user[0], admin_role))
                
                # Assign moderator role to some users
                for user in company_users[1:3]:
                    if len(company_users) > 3:
                        cursor.execute("""
                            INSERT INTO user_roles (user_id, role_id)
                            VALUES (%s, %s)
                            ON CONFLICT (user_id, role_id) DO NOTHING
                        """, (user[0], mod_role))
                
                # Assign member role to remaining users
                for user in company_users:
                    cursor.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES (%s, %s)
                        ON CONFLICT (user_id, role_id) DO NOTHING
                    """, (user[0], member_role))
            
            # Add users to private management channel
            management_channel = next((channel_id for channel_id, channel_name in channels if channel_name == 'management'), None)
            if management_channel:
                # Add admin and moderators to management channel
                for user in company_users[:3]:
                    cursor.execute("""
                        INSERT INTO channel_members (channel_id, user_id)
                        VALUES (%s, %s)
                        ON CONFLICT (channel_id, user_id) DO NOTHING
                    """, (management_channel, user[0]))
            
            # Generate messages for each channel
            for channel_id, channel_name in channels:
                # Generate between 5-20 messages per channel
                message_count = random.randint(5, 20)
                
                for _ in range(message_count):
                    # Select random user from company
                    user = random.choice(company_users)
                    user_id = user[0]
                    
                    # Generate message content
                    if channel_name == 'announcements':
                        content = fake.paragraph(nb_sentences=2) + "\n\n" + fake.sentence()
                    elif channel_name == 'projects':
                        content = random.choice([
                            f"Working on {fake.bs()}",
                            f"Just finished the {fake.word()} module",
                            f"Need help with {fake.word()} implementation",
                            f"Project update: {fake.paragraph(nb_sentences=1)}"
                        ])
                    elif channel_name == 'random':
                        content = random.choice([
                            fake.paragraph(nb_sentences=1),
                            f"Did you see this? {fake.uri()}",
                            f"Check out this article: {fake.catch_phrase()}",
                            f"Anyone interested in {fake.word()}?"
                        ])
                    elif channel_name == 'help':
                        content = random.choice([
                            f"How do I {fake.bs()}?",
                            f"Need assistance with {fake.word()}",
                            f"Can someone help me understand {fake.catch_phrase()}?",
                            f"Looking for documentation on {fake.word()}"
                        ])
                    else:
                        content = fake.paragraph(nb_sentences=random.randint(1, 3))
                    
                    # Insert message
                    cursor.execute("""
                        INSERT INTO messages (channel_id, user_id, content)
                        VALUES (%s, %s, %s)
                    """, (channel_id, user_id, content))
                
                print(f"Generated {message_count} messages for {channel_name} channel")
        
        # Commit all changes
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        print(f"Error seeding chat data: {e}")
    finally:
        close_db_connection(conn, cursor)

def display_chat_system_info():
    """Display detailed information about the chat system"""
    conn, cursor = connect_to_db()
    
    try:
        print("\n===== CHAT SYSTEM INFORMATION =====\n")
        
        # Companies
        cursor.execute("SELECT id, name FROM companies")
        companies = cursor.fetchall()
        print(f"Found {len(companies)} companies:")
        for company_id, company_name in companies:
            print(f"  - {company_name} (ID: {company_id})")
        
        # Users
        cursor.execute("SELECT id, first_name, last_name, email, company_id FROM users")
        users = cursor.fetchall()
        print(f"\nFound {len(users)} users:")
        for i, (user_id, first_name, last_name, email, company_id) in enumerate(users[:5]):
            company_name = next((name for cid, name in companies if cid == company_id), "No Company")
            print(f"  - {first_name} {last_name} ({email}) - Company: {company_name}")
        if len(users) > 5:
            print(f"  ... and {len(users) - 5} more users")
        
        # Chat servers
        cursor.execute("""
            SELECT cs.id, cs.name, cs.company_id, c.name as company_name
            FROM chat_servers cs
            JOIN companies c ON cs.company_id = c.id
        """)
        servers = cursor.fetchall()
        print(f"\nFound {len(servers)} chat servers:")
        for server_id, server_name, company_id, company_name in servers:
            print(f"  - {server_name} (ID: {server_id}) - Company: {company_name}")
            
            # Channels for this server
            cursor.execute("""
                SELECT id, name, is_private
                FROM chat_channels
                WHERE server_id = %s
                ORDER BY name
            """, (server_id,))
            channels = cursor.fetchall()
            print(f"    Channels ({len(channels)}):")
            for channel_id, channel_name, is_private in channels:
                privacy = "Private" if is_private else "Public"
                
                # Count messages in this channel
                cursor.execute("SELECT COUNT(*) FROM messages WHERE channel_id = %s", (channel_id,))
                message_count = cursor.fetchone()[0]
                
                print(f"      - {channel_name} ({privacy}) - {message_count} messages")
            
            # Roles for this server
            cursor.execute("SELECT id, name FROM server_roles WHERE server_id = %s", (server_id,))
            roles = cursor.fetchall()
            print(f"    Roles ({len(roles)}):")
            for role_id, role_name in roles:
                # Count users with this role
                cursor.execute("""
                    SELECT COUNT(*) FROM user_roles
                    WHERE role_id = %s
                """, (role_id,))
                user_count = cursor.fetchone()[0]
                print(f"      - {role_name} - {user_count} users")
                
                # Show some users with this role
                cursor.execute("""
                    SELECT u.first_name, u.last_name
                    FROM user_roles ur
                    JOIN users u ON ur.user_id = u.id
                    WHERE ur.role_id = %s
                    LIMIT 3
                """, (role_id,))
                role_users = cursor.fetchall()
                if role_users:
                    user_names = [f"{first} {last}" for first, last in role_users]
                    print(f"        Users: {', '.join(user_names)}" + 
                          (f" and {user_count - 3} more..." if user_count > 3 else ""))
        
        # Message statistics
        cursor.execute("SELECT COUNT(*) FROM messages")
        total_messages = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT u.first_name, u.last_name, COUNT(m.id) as message_count
            FROM messages m
            JOIN users u ON m.user_id = u.id
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY message_count DESC
            LIMIT 5
        """)
        top_posters = cursor.fetchall()
        
        print(f"\nMessage Statistics:")
        print(f"  - Total messages: {total_messages}")
        print(f"  - Top posters:")
        for first_name, last_name, message_count in top_posters:
            print(f"    - {first_name} {last_name}: {message_count} messages")
        
        print("\n===== END OF CHAT SYSTEM INFORMATION =====")
        
    except Exception as e:
        print(f"Error displaying chat system info: {e}")
    finally:
        close_db_connection(conn, cursor)

if __name__ == "__main__":
    seed_chat_data()
    display_chat_system_info()
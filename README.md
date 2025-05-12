# AI Face Swapper with Chat System

This project includes a dedicated chat server implementation to avoid routing errors and stack overflow issues.

## Project Structure

- `server.js` - Main API server
- `chat-server.js` - Dedicated chat server
- `frontend-old/` - Frontend React application

## Setup Instructions

### Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend-old
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```
DB_USER=postgres
DB_PASSWORD=vishwak
DB_HOST=localhost
DB_PORT=5432
DB_NAME=property_mapping
JWT_SECRET=your-secret-key
PORT=5000
```

Create a `.env` file in the `frontend-old` directory:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_CHAT_API_URL=http://localhost:5001/api
PORT=3000
```

### Start the Application

You can use the provided batch file to start all servers:

```bash
# Windows
start-servers.bat

# Or start them individually
node server.js
node chat-server.js
cd frontend-old && npm start
```

## Chat System Architecture

The chat system uses a dedicated server to avoid routing errors and object reference issues:

1. **Main API Server (port 5000)** - Handles authentication, user management, and other API endpoints
2. **Chat Server (port 5001)** - Dedicated server for chat functionality using function declarations
3. **Frontend (port 3000)** - React application that connects to both servers

## Key Features

- Real-time messaging with Socket.IO
- User presence indicators
- Message editing and deletion
- Channel management
- Private channels
- User roles and permissions

## Troubleshooting

If you encounter any issues:

1. Check that both servers are running
2. Verify database connection settings
3. Ensure the frontend is connecting to the correct API endpoints
4. Check browser console for errors
5. Restart the servers if needed

## Database Schema

The chat system uses the following tables:

- `chat_servers` - Chat servers for companies
- `chat_channels` - Channels within servers
- `messages` - Messages in channels
- `server_roles` - User roles in servers
- `user_roles` - Role assignments
- `channel_members` - Members of private channels
- `user_presence` - User online status
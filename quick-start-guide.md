# Property Mapping Platform - Quick Start Guide

This guide provides step-by-step instructions to get the Property Mapping Platform up and running quickly.

## Prerequisites

- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- npm or yarn

## Setup Steps

### 1. Clone the Repository

If you haven't already, clone the repository to your local machine.

### 2. Install Dependencies

Run the setup script appropriate for your operating system:

**Windows:**
```
setup.bat
```

**Linux/macOS:**
```
chmod +x setup-linux.sh
./setup-linux.sh
```

Alternatively, you can install dependencies manually:

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Copy the example environment file and update it with your configuration:

```bash
cd backend
cp config/.env.example config/.env
```

Edit the `.env` file with your MongoDB connection string, JWT secret, and API keys.

### 4. Seed the Database

Populate the database with sample data:

```bash
npm run seed
```

### 5. Start the Application

Start both the backend and frontend servers:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

## Accessing the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Default Login Credentials

Use these credentials to log in:

```
Email: john.doe@acmerealestate.com
Password: password123
```

## API Documentation

API documentation is available at:

```
http://localhost:5000/api-docs
```

## Troubleshooting

### MongoDB Connection Issues

Ensure MongoDB is running:

**Windows:**
```
net start MongoDB
```

**Linux/macOS:**
```
sudo systemctl start mongod
```

### Port Conflicts

If you have port conflicts, you can change the ports in:
- Backend: `backend/config/.env` (PORT variable)
- Frontend: `frontend/package.json` (proxy setting)

### Other Issues

Check the logs for more detailed error information:
- Backend logs are displayed in the terminal where you ran `npm run dev`
- Frontend logs are available in the browser console
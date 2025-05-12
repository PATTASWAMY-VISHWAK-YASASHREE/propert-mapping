# Property Mapping Platform - Setup Guide

This guide provides instructions for setting up and running the Property Mapping Platform application.

## Prerequisites

- Node.js (v14.x or higher)
- MongoDB (v4.x or higher)
- npm or yarn

## Directory Structure

The application follows a standard structure with backend and frontend directories:

```
property-mapping-platform/
├── backend/                # Node.js/Express API
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── integrations/       # Third-party API integrations
├── frontend/               # React application
│   ├── public/             # Static files
│   └── src/                # React source code
├── database/               # Database migrations and seeds
└── docs/                   # Documentation
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd property-mapping-platform
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create .env file from example
cp config/.env.example config/.env

# Edit the .env file with your configuration
# Especially set the MONGO_URI and JWT_SECRET

# Install dependencies
npm install

# Start the backend server
npm start
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```

### 4. Database Setup

The application uses MongoDB. Make sure you have MongoDB running locally or provide a connection string to a MongoDB Atlas cluster in the `.env` file.

#### Setting up initial data:

```bash
# Navigate to database directory
cd database

# Run database seeding script
node seeds/seed.js
```

## API Keys Setup

The application integrates with several third-party APIs. You'll need to obtain API keys for:

1. Here.com - For mapping and location data
2. Wealth Engine - For wealth data analysis
3. PitchBook - For company and investor data
4. ReportAll.com - For aggregated reports
5. ZoomInfo - For business contact information
6. Zillow - For property valuation data
7. Fast People Search - For individual information

Add these API keys to your `.env` file.

## Running the Application

### Development Mode

Run both backend and frontend in development mode:

```bash
# In the root directory
npm run dev
```

This will start both the backend server and the frontend development server concurrently.

### Production Mode

For production deployment:

```bash
# Build the frontend
cd frontend
npm run build

# Start the production server
cd ..
npm start
```

## Missing Files to Create

Based on the implementation plan and current directory structure, the following files need to be created:

### Backend

1. **Models**:
   - `backend/models/SavedMapView.js`
   - `backend/models/Report.js`
   - `backend/models/SavedSearch.js`

2. **Services**:
   - `backend/services/emailService.js`
   - `backend/services/authService.js`
   - `backend/services/mapService.js`
   - `backend/services/wealthService.js`
   - `backend/services/reportService.js`

3. **Integrations**:
   - `backend/integrations/pitchBookApi.js`
   - `backend/integrations/reportAllApi.js`
   - `backend/integrations/zoomInfoApi.js`
   - `backend/integrations/zillowApi.js`
   - `backend/integrations/fastPeopleApi.js`

4. **Database Seeds**:
   - `database/seeds/seed.js`
   - `database/seeds/companySeeder.js`
   - `database/seeds/userSeeder.js`
   - `database/seeds/propertySeeder.js`
   - `database/seeds/ownerSeeder.js`

### Frontend

1. **Core Files**:
   - `frontend/src/index.js`
   - `frontend/public/index.html`

2. **Pages**:
   - `frontend/src/pages/Landing.js`
   - `frontend/src/pages/Register.js`
   - `frontend/src/pages/ForgotPassword.js`
   - `frontend/src/pages/ResetPassword.js`
   - `frontend/src/pages/AcceptInvite.js`
   - `frontend/src/pages/Reports.js`
   - `frontend/src/pages/ReportDetail.js`
   - `frontend/src/pages/Bookmarks.js`
   - `frontend/src/pages/SavedSearches.js`
   - `frontend/src/pages/OwnerDetail.js`
   - `frontend/src/pages/admin/AdminDashboard.js`
   - `frontend/src/pages/admin/UserManagement.js`
   - `frontend/src/pages/admin/CompanySettings.js`
   - `frontend/src/pages/user/Profile.js`
   - `frontend/src/pages/user/SecuritySettings.js`
   - `frontend/src/pages/user/NotificationSettings.js`

3. **Redux Actions**:
   - `frontend/src/store/actions/userActions.js`
   - `frontend/src/store/actions/companyActions.js`
   - `frontend/src/store/actions/propertyActions.js`
   - `frontend/src/store/actions/reportActions.js`
   - `frontend/src/store/actions/searchActions.js`

4. **Redux Reducers**:
   - `frontend/src/store/reducers/userReducer.js`
   - `frontend/src/store/reducers/companyReducer.js`
   - `frontend/src/store/reducers/propertyReducer.js`
   - `frontend/src/store/reducers/reportReducer.js`
   - `frontend/src/store/reducers/searchReducer.js`

5. **Services**:
   - `frontend/src/services/api.js`
   - `frontend/src/services/authService.js`
   - `frontend/src/services/mapService.js`
   - `frontend/src/services/propertyService.js`
   - `frontend/src/services/wealthService.js`
   - `frontend/src/services/reportService.js`

## Deployment

The application is configured for deployment on platforms like Heroku:

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create property-mapping-platform

# Add MongoDB addon
heroku addons:create mongodb:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
# Add other environment variables...

# Deploy to Heroku
git push heroku main

# Open the deployed app
heroku open
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**:
   - Ensure MongoDB is running
   - Check connection string in `.env` file
   - Verify network connectivity to MongoDB Atlas if using cloud hosting

2. **API Key Issues**:
   - Verify all API keys are correctly set in `.env` file
   - Check for API usage limits or restrictions

3. **Frontend Build Issues**:
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Logs

- Backend logs: Check the console where the backend server is running
- Frontend development logs: Check the console where the frontend server is running
- Production logs: If deployed to Heroku, use `heroku logs --tail`

## Next Steps

After setting up the basic application, consider implementing:

1. Automated testing
2. CI/CD pipeline
3. Monitoring and logging
4. User documentation
5. Advanced features from the implementation plan
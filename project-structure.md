# Property Mapping Platform - Project Structure

## Directory Structure

```
property-mapping-platform/
├── backend/
│   ├── config/
│   │   ├── database.js         # Database configuration
│   │   ├── auth.js             # Authentication configuration
│   │   └── api-keys.js         # Third-party API keys (gitignored)
│   ├── controllers/
│   │   ├── companyController.js    # Company registration and management
│   │   ├── userController.js       # User management
│   │   ├── propertyController.js   # Property data
│   │   ├── mapController.js        # Map data
│   │   ├── wealthController.js     # Wealth analysis
│   │   └── reportController.js     # Reports and exports
│   ├── middleware/
│   │   ├── auth.js             # Authentication middleware
│   │   ├── permissions.js      # Role-based access control
│   │   └── rateLimiter.js      # API rate limiting
│   ├── models/
│   │   ├── Company.js          # Company model
│   │   ├── User.js             # User model
│   │   ├── Property.js         # Property model
│   │   ├── Owner.js            # Property owner model
│   │   ├── WealthProfile.js    # Wealth data model
│   │   ├── Report.js           # Report model
│   │   └── SavedSearch.js      # Saved search model
│   ├── routes/
│   │   ├── company.js          # Company routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── users.js            # User management routes
│   │   ├── properties.js       # Property data routes
│   │   ├── map.js              # Map data routes
│   │   ├── wealth.js           # Wealth analysis routes
│   │   └── reports.js          # Report generation routes
│   ├── services/
│   │   ├── emailService.js     # Email notifications
│   │   ├── authService.js      # Authentication logic
│   │   ├── mapService.js       # Map processing
│   │   ├── wealthService.js    # Wealth data processing
│   │   └── reportService.js    # Report generation
│   ├── integrations/
│   │   ├── hereApi.js          # Here.com mapping integration
│   │   ├── pitchBookApi.js     # PitchBook integration
│   │   ├── wealthEngineApi.js  # Wealth Engine integration
│   │   ├── reportAllApi.js     # ReportAll integration
│   │   ├── zoomInfoApi.js      # ZoomInfo integration
│   │   ├── zillowApi.js        # Zillow integration
│   │   └── fastPeopleApi.js    # Fast People Search integration
│   ├── utils/
│   │   ├── logger.js           # Logging utility
│   │   ├── validation.js       # Input validation
│   │   └── errorHandler.js     # Error handling
│   ├── app.js                  # Express application setup
│   ├── server.js               # Server entry point
│   └── package.json            # Backend dependencies
├── frontend/
│   ├── public/
│   │   ├── index.html          # HTML template
│   │   └── favicon.ico         # Site favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Shared components
│   │   │   ├── admin/          # Admin components
│   │   │   ├── map/            # Map components
│   │   │   ├── property/       # Property components
│   │   │   ├── wealth/         # Wealth analysis components
│   │   │   └── reports/        # Report components
│   │   ├── pages/
│   │   │   ├── Login.js        # Login page
│   │   │   ├── Register.js     # Registration page
│   │   │   ├── Dashboard.js    # User dashboard
│   │   │   ├── AdminPanel.js   # Admin panel
│   │   │   ├── MapView.js      # Property map view
│   │   │   ├── PropertyDetail.js # Property details
│   │   │   ├── WealthAnalysis.js # Wealth analysis
│   │   │   └── Reports.js      # Reports page
│   │   ├── services/
│   │   │   ├── api.js          # API client setup
│   │   │   ├── authService.js  # Authentication service
│   │   │   ├── mapService.js   # Map service
│   │   │   ├── propertyService.js # Property service
│   │   │   ├── wealthService.js # Wealth service
│   │   │   └── reportService.js # Report service
│   │   ├── store/
│   │   │   ├── actions/        # Redux actions
│   │   │   ├── reducers/       # Redux reducers
│   │   │   ├── types.js        # Action types
│   │   │   └── store.js        # Redux store
│   │   ├── utils/
│   │   │   ├── auth.js         # Auth utilities
│   │   │   ├── formatting.js   # Data formatting
│   │   │   └── validation.js   # Form validation
│   │   ├── assets/
│   │   │   ├── images/         # Image assets
│   │   │   ├── styles/         # CSS/SCSS files
│   │   │   └── icons/          # Icon assets
│   │   ├── App.js              # Main application component
│   │   ├── index.js            # Application entry point
│   │   └── routes.js           # Application routes
│   ├── package.json            # Frontend dependencies
│   └── .env                    # Environment variables (gitignored)
├── database/
│   ├── migrations/             # Database migrations
│   └── seeds/                  # Seed data
├── docs/
│   ├── api/                    # API documentation
│   └── user-guides/            # User guides
├── .gitignore                  # Git ignore file
├── docker-compose.yml          # Docker compose configuration
├── README.md                   # Project documentation
└── package.json                # Root package.json
```

## Database Schema

```
Companies
- id (PK)
- name
- logo_url
- created_at
- updated_at

Users
- id (PK)
- company_id (FK)
- email
- password_hash
- first_name
- last_name
- role (admin, user)
- mfa_enabled
- mfa_secret
- last_login
- status (active, invited, disabled)
- created_at
- updated_at

Properties
- id (PK)
- address
- city
- state
- zip_code
- latitude
- longitude
- property_type
- size_sqft
- bedrooms
- bathrooms
- year_built
- assessed_value
- market_value
- last_sale_date
- last_sale_amount
- images_json
- created_at
- updated_at

Owners
- id (PK)
- name
- type (individual, entity)
- contact_info_json
- created_at
- updated_at

PropertyOwnership
- id (PK)
- property_id (FK)
- owner_id (FK)
- ownership_percentage
- start_date
- end_date
- created_at
- updated_at

WealthProfiles
- id (PK)
- owner_id (FK)
- estimated_net_worth
- confidence_level
- wealth_composition_json
- data_sources_json
- last_updated
- created_at
- updated_at

SavedSearches
- id (PK)
- user_id (FK)
- name
- filters_json
- created_at
- updated_at

SavedMapViews
- id (PK)
- user_id (FK)
- name
- center_lat
- center_lng
- zoom_level
- filters_json
- created_at
- updated_at

Reports
- id (PK)
- user_id (FK)
- name
- type
- parameters_json
- schedule_json (null if one-time)
- last_generated
- created_at
- updated_at

UserActivity
- id (PK)
- user_id (FK)
- activity_type
- details_json
- ip_address
- created_at

Bookmarks
- id (PK)
- user_id (FK)
- property_id (FK)
- notes
- created_at
- updated_at
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register company admin
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- POST /api/auth/refresh - Refresh token
- POST /api/auth/mfa/setup - Set up MFA
- POST /api/auth/mfa/verify - Verify MFA code

### Company Management
- POST /api/companies - Create company
- GET /api/companies/:id - Get company details
- PUT /api/companies/:id - Update company
- GET /api/companies/:id/stats - Get company usage statistics

### User Management
- POST /api/users/invite - Invite user
- GET /api/users - List users
- GET /api/users/:id - Get user details
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Disable user
- GET /api/users/:id/activity - Get user activity

### Property Map
- GET /api/map/properties - Get properties for map
- GET /api/map/clusters - Get property clusters for map
- POST /api/map/views - Save map view
- GET /api/map/views - Get saved map views
- DELETE /api/map/views/:id - Delete saved map view

### Properties
- GET /api/properties - List properties
- GET /api/properties/:id - Get property details
- GET /api/properties/:id/history - Get property history
- POST /api/properties/bookmark - Bookmark property
- DELETE /api/properties/bookmark/:id - Remove bookmark
- GET /api/properties/bookmarks - Get bookmarked properties

### Wealth Analysis
- GET /api/wealth/owners/:id - Get owner wealth profile
- GET /api/wealth/compare - Compare multiple owners

### Search & Filtering
- POST /api/search - Search properties/owners
- POST /api/search/save - Save search
- GET /api/search/saved - Get saved searches
- DELETE /api/search/saved/:id - Delete saved search

### Reports
- POST /api/reports - Create report
- GET /api/reports - List reports
- GET /api/reports/:id - Get report
- DELETE /api/reports/:id - Delete report
- POST /api/reports/:id/schedule - Schedule report
- DELETE /api/reports/:id/schedule - Cancel scheduled report
- GET /api/reports/exports - Get export history
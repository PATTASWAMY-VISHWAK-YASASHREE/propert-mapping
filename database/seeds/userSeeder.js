/**
 * User Seeder
 * Sample user data for seeding the database
 */

const bcrypt = require('bcryptjs');

// Pre-hash passwords for seeding
const password = bcrypt.hashSync('password123', 10);

module.exports = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@acmerealestate.com',
    password,
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2023-06-15T10:30:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: true
      },
      theme: 'light'
    }
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@acmerealestate.com',
    password,
    role: 'manager',
    status: 'active',
    lastLogin: new Date('2023-06-14T14:45:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: true
      },
      theme: 'dark'
    }
  },
  {
    firstName: 'Robert',
    lastName: 'Johnson',
    email: 'robert.johnson@pinnacleproperties.com',
    password,
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2023-06-15T09:15:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: false
      },
      theme: 'system'
    }
  },
  {
    firstName: 'Emily',
    lastName: 'Williams',
    email: 'emily.williams@pinnacleproperties.com',
    password,
    role: 'user',
    status: 'active',
    lastLogin: new Date('2023-06-13T11:20:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: false,
        inApp: true
      },
      theme: 'light'
    }
  },
  {
    firstName: 'Michael',
    lastName: 'Brown',
    email: 'michael.brown@summitinvestments.com',
    password,
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2023-06-14T16:30:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: true
      },
      theme: 'dark'
    }
  },
  {
    firstName: 'Sarah',
    lastName: 'Davis',
    email: 'sarah.davis@summitinvestments.com',
    password,
    role: 'manager',
    status: 'active',
    lastLogin: new Date('2023-06-15T08:45:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: true
      },
      theme: 'light'
    }
  },
  {
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.miller@horizonrealty.com',
    password,
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2023-06-14T13:10:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: false
      },
      theme: 'system'
    }
  },
  {
    firstName: 'Jessica',
    lastName: 'Wilson',
    email: 'jessica.wilson@horizonrealty.com',
    password,
    role: 'user',
    status: 'active',
    lastLogin: new Date('2023-06-13T15:25:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: false,
        inApp: true
      },
      theme: 'dark'
    }
  },
  {
    firstName: 'Thomas',
    lastName: 'Moore',
    email: 'thomas.moore@capitalventures.com',
    password,
    role: 'admin',
    status: 'active',
    lastLogin: new Date('2023-06-15T11:50:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: true
      },
      theme: 'light'
    }
  },
  {
    firstName: 'Amanda',
    lastName: 'Taylor',
    email: 'amanda.taylor@capitalventures.com',
    password,
    role: 'manager',
    status: 'active',
    lastLogin: new Date('2023-06-14T10:05:00'),
    acceptedTerms: true,
    completedOnboarding: true,
    preferences: {
      notifications: {
        email: true,
        inApp: true
      },
      theme: 'system'
    }
  }
];
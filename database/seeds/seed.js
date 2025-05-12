/**
 * Database Seeder
 * Seeds the database with initial data
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');

// Load environment variables
dotenv.config({ path: './config/.env' });

// Import models
const Company = require('../models/Company');
const User = require('../models/User');
const Property = require('../models/Property');
const Owner = require('../models/Owner');
const WealthProfile = require('../models/WealthProfile');
const SavedMapView = require('../models/SavedMapView');
const Report = require('../models/Report');
const SavedSearch = require('../models/SavedSearch');

// Import seed data
const companySeed = require('./companySeeder');
const userSeed = require('./userSeeder');
const propertySeed = require('./propertySeeder');
const ownerSeed = require('./ownerSeeder');
const wealthProfileSeed = require('./wealthProfileSeeder');

// Connect to database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Seed database
const seedDatabase = async () => {
  try {
    console.log('Clearing database...'.yellow);
    
    // Delete all existing data
    await Company.deleteMany();
    await User.deleteMany();
    await Property.deleteMany();
    await Owner.deleteMany();
    await WealthProfile.deleteMany();
    await SavedMapView.deleteMany();
    await Report.deleteMany();
    await SavedSearch.deleteMany();
    
    console.log('Database cleared'.green);
    
    console.log('Seeding companies...'.yellow);
    const companies = await Company.create(companySeed);
    console.log(`${companies.length} companies seeded`.green);
    
    console.log('Seeding users...'.yellow);
    // Add company IDs to users
    const usersWithCompanies = userSeed.map((user, index) => ({
      ...user,
      company: companies[index % companies.length]._id
    }));
    const users = await User.create(usersWithCompanies);
    console.log(`${users.length} users seeded`.green);
    
    console.log('Seeding owners...'.yellow);
    const owners = await Owner.create(ownerSeed);
    console.log(`${owners.length} owners seeded`.green);
    
    console.log('Seeding properties...'.yellow);
    // Add owner IDs to properties
    const propertiesWithOwners = propertySeed.map((property, index) => {
      const ownerIndex = index % owners.length;
      return {
        ...property,
        currentOwnership: [{
          ownerId: owners[ownerIndex]._id,
          ownershipPercentage: 100,
          startDate: new Date('2020-01-01')
        }]
      };
    });
    const properties = await Property.create(propertiesWithOwners);
    console.log(`${properties.length} properties seeded`.green);
    
    console.log('Seeding wealth profiles...'.yellow);
    // Add owner IDs to wealth profiles
    const wealthProfilesWithOwners = wealthProfileSeed.map((profile, index) => ({
      ...profile,
      owner: owners[index % owners.length]._id
    }));
    const wealthProfiles = await WealthProfile.create(wealthProfilesWithOwners);
    console.log(`${wealthProfiles.length} wealth profiles seeded`.green);
    
    console.log('Database seeded successfully!'.green.bold);
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error}`.red.bold);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
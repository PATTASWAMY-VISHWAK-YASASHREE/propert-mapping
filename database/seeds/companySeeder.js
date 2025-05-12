/**
 * Company Seeder
 * Sample company data for seeding the database
 */

module.exports = [
  {
    name: 'Acme Real Estate',
    logo: 'https://example.com/logos/acme.png',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    contactEmail: 'info@acmerealestate.com',
    contactPhone: '(212) 555-1234',
    website: 'https://www.acmerealestate.com',
    dataAccessPreferences: {
      allowPropertyExport: true,
      allowWealthDataAccess: true,
      allowBulkExport: true,
      maxExportRecords: 5000
    },
    subscription: {
      plan: 'enterprise',
      status: 'active',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-01-01')
    },
    active: true
  },
  {
    name: 'Pinnacle Properties',
    logo: 'https://example.com/logos/pinnacle.png',
    address: {
      street: '456 Market St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    },
    contactEmail: 'contact@pinnacleproperties.com',
    contactPhone: '(415) 555-6789',
    website: 'https://www.pinnacleproperties.com',
    dataAccessPreferences: {
      allowPropertyExport: true,
      allowWealthDataAccess: true,
      allowBulkExport: false,
      maxExportRecords: 1000
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      startDate: new Date('2023-03-15'),
      endDate: new Date('2024-03-15')
    },
    active: true
  },
  {
    name: 'Summit Investments',
    logo: 'https://example.com/logos/summit.png',
    address: {
      street: '789 Oak Ave',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60611',
      country: 'USA'
    },
    contactEmail: 'info@summitinvestments.com',
    contactPhone: '(312) 555-9012',
    website: 'https://www.summitinvestments.com',
    dataAccessPreferences: {
      allowPropertyExport: true,
      allowWealthDataAccess: true,
      allowBulkExport: true,
      maxExportRecords: 2000
    },
    subscription: {
      plan: 'enterprise',
      status: 'active',
      startDate: new Date('2023-02-10'),
      endDate: new Date('2024-02-10')
    },
    active: true
  },
  {
    name: 'Horizon Realty',
    logo: 'https://example.com/logos/horizon.png',
    address: {
      street: '321 Pine St',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      country: 'USA'
    },
    contactEmail: 'contact@horizonrealty.com',
    contactPhone: '(206) 555-3456',
    website: 'https://www.horizonrealty.com',
    dataAccessPreferences: {
      allowPropertyExport: true,
      allowWealthDataAccess: false,
      allowBulkExport: false,
      maxExportRecords: 500
    },
    subscription: {
      plan: 'basic',
      status: 'active',
      startDate: new Date('2023-04-20'),
      endDate: new Date('2024-04-20')
    },
    active: true
  },
  {
    name: 'Capital Ventures',
    logo: 'https://example.com/logos/capital.png',
    address: {
      street: '555 Elm St',
      city: 'Boston',
      state: 'MA',
      zipCode: '02110',
      country: 'USA'
    },
    contactEmail: 'info@capitalventures.com',
    contactPhone: '(617) 555-7890',
    website: 'https://www.capitalventures.com',
    dataAccessPreferences: {
      allowPropertyExport: true,
      allowWealthDataAccess: true,
      allowBulkExport: false,
      maxExportRecords: 1000
    },
    subscription: {
      plan: 'professional',
      status: 'active',
      startDate: new Date('2023-05-05'),
      endDate: new Date('2024-05-05')
    },
    active: true
  }
];
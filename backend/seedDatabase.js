const bcrypt = require('bcryptjs');
const db = require('./config/database');

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user'
  }
];

const sampleResources = [
  {
    name: 'Conference Room A',
    type: 'room',
    description: 'Large conference room with projector and video conferencing',
    availability: true,
    location: 'Building 1, Floor 2',
    capacity: 20,
    specifications: {
      equipment: ['Projector', 'Video Conference', 'Whiteboard'],
      size: '500 sq ft'
    }
  },
  {
    name: 'MacBook Pro 16"',
    type: 'equipment',
    description: 'High-performance laptop for development work',
    availability: true,
    location: 'IT Department',
    capacity: 1,
    specifications: {
      processor: 'M1 Pro',
      memory: '32GB',
      storage: '1TB SSD'
    }
  },
  {
    name: 'Company Vehicle - Toyota Camry',
    type: 'vehicle',
    description: 'Official company car for business trips',
    availability: false,
    location: 'Parking Lot B',
    capacity: 5,
    specifications: {
      year: '2023',
      licensePlate: 'ABC-123',
      fuelType: 'Hybrid'
    }
  },
  {
    name: 'Adobe Creative Suite License',
    type: 'software',
    description: 'Full Adobe Creative Cloud license for design work',
    availability: true,
    location: 'Digital License',
    capacity: 10,
    specifications: {
      licenseType: 'Enterprise',
      validUntil: '2024-12-31',
      applications: ['Photoshop', 'Illustrator', 'InDesign', 'Premiere Pro']
    }
  },
  {
    name: 'Portable Projector',
    type: 'equipment',
    description: 'Compact projector for presentations',
    availability: true,
    location: 'Equipment Room',
    capacity: 1,
    specifications: {
      resolution: '1080p',
      brightness: '3000 lumens',
      weight: '2.5 kg'
    }
  },
  {
    name: 'Meeting Room B',
    type: 'room',
    description: 'Small meeting room for team discussions',
    availability: true,
    location: 'Building 1, Floor 1',
    capacity: 8,
    specifications: {
      equipment: ['TV Screen', 'Whiteboard'],
      size: '200 sq ft'
    }
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await new Promise((resolve, reject) => {
      db.getUsersDB().remove({}, { multi: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.getResourcesDB().remove({}, { multi: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Seed users
    console.log('👥 Creating sample users...');
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = {
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await new Promise((resolve, reject) => {
        db.getUsersDB().insert(user, (err, newUser) => {
          if (err) reject(err);
          else {
            console.log(`  ✓ Created user: ${newUser.name} (${newUser.email})`);
            resolve(newUser);
          }
        });
      });
    }

    // Seed resources
    console.log('📦 Creating sample resources...');
    for (const resourceData of sampleResources) {
      const resource = {
        ...resourceData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await new Promise((resolve, reject) => {
        db.getResourcesDB().insert(resource, (err, newResource) => {
          if (err) reject(err);
          else {
            console.log(`  ✓ Created resource: ${newResource.name} (${newResource.type})`);
            resolve(newResource);
          }
        });
      });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log('');
    console.log('📋 Sample accounts created:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  User:  john@example.com / user123');
    console.log('  User:  jane@example.com / user123');
    console.log('');
    console.log('You can now start the application and login with these credentials.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }

  process.exit(0);
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

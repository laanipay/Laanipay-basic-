const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Stage = require('../models/Stage');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lpn_pro_mlm', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize default admin user
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const adminUser = new User({
        firstName: 'System',
        lastName: 'Administrator',
        email: process.env.ADMIN_EMAIL || 'admin@lpnpro.com',
        phoneNumber: '+2348000000000',
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        withdrawalPin: '0000',
        role: 'admin',
        emailVerified: true,
        registrationFee: {
          paid: true,
          paidAt: new Date(),
        },
        isActive: true,
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);
    } else {
      console.log('ℹ️  Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Initialize system settings
const initializeSystemSettings = async () => {
  try {
    // Create system configuration document if needed
    console.log('✅ System settings initialized');
  } catch (error) {
    console.error('❌ Error initializing system settings:', error);
  }
};

// Create sample test users for development
const createSampleUsers = async () => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  try {
    const sampleUsers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+2348123456789',
        password: 'password123',
        withdrawalPin: '1234',
        role: 'member',
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phoneNumber: '+2348123456790',
        password: 'password123',
        withdrawalPin: '1234',
        role: 'coordinator',
        coordinatorLevel: 1,
      },
    ];

    for (const userData of sampleUsers) {
      const userExists = await User.findOne({ email: userData.email });
      
      if (!userExists) {
        const user = new User({
          ...userData,
          emailVerified: true,
          registrationFee: {
            paid: true,
            paidAt: new Date(),
          },
          isActive: true,
        });

        await user.save();
        console.log(`✅ Sample user created: ${userData.email}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
  }
};

// Verify database indexes
const verifyIndexes = async () => {
  try {
    // Verify User indexes
    await User.collection.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { userId: 1 }, unique: true },
      { key: { referralCode: 1 }, unique: true },
      { key: { sponsorId: 1 } },
      { key: { parentId: 1 } },
      { key: { currentStage: 1 } },
      { key: { role: 1 } },
      { key: { createdAt: -1 } },
    ]);

    console.log('✅ Database indexes verified');
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
  }
};

// Main initialization function
const initializeDatabase = async () => {
  try {
    console.log('🚀 Starting database initialization...\n');

    // Connect to database
    await connectDB();

    // Initialize default stages
    console.log('📊 Initializing MLM stages...');
    await Stage.initializeDefaultStages();

    // Create admin user
    console.log('👤 Setting up admin user...');
    await createAdminUser();

    // Initialize system settings
    console.log('⚙️  Initializing system settings...');
    await initializeSystemSettings();

    // Create sample users for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Creating sample users for development...');
      await createSampleUsers();
    }

    // Verify database indexes
    console.log('🔍 Verifying database indexes...');
    await verifyIndexes();

    console.log('\n✅ Database initialization completed successfully!');
    console.log('\n🎯 System is ready to use:');
    console.log(`   - Backend API: http://localhost:${process.env.PORT || 5000}`);
    console.log(`   - Admin Panel: http://localhost:3000/admin`);
    console.log(`   - Admin Email: ${process.env.ADMIN_EMAIL || 'admin@lpnpro.com'}`);
    console.log(`   - Admin Password: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📤 Database connection closed');
    process.exit(0);
  }
};

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = {
  initializeDatabase,
  createAdminUser,
  createSampleUsers,
};
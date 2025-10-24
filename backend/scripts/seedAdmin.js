require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');

async function createAdminUser() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@enishradio.com' } });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@enishradio.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@enishradio.com');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

createAdminUser();
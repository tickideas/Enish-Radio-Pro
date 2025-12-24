import 'dotenv/config';
import UserModel from '../drizzle/models/User.js';

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');

    // Check if admin user already exists
    const existingAdmin = await UserModel.findByEmail('admin@enishradio.com');
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`   Email: admin@enishradio.com`);
      process.exit(0);
    }

    // Create admin user with default password
    const adminUser = await UserModel.create({
      email: 'admin@enishradio.com',
      password: 'Admin@123456',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email: admin@enishradio.com');
    console.log('   Password: Admin@123456');
    console.log('   ⚠️  Please change the password after first login.');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();

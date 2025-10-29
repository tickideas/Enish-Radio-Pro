import dotenv from 'dotenv';
import { db } from '../drizzle/db.js';
import { users, socialLinks, adBanners } from '../drizzle/schema.js';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@enishradio.com')
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists, skipping creation');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = await db.insert(users).values({
        email: 'admin@enishradio.com',
        password: hashedPassword,
        role: 'admin'
      }).returning();
      
      console.log('✅ Admin user created successfully!');
      console.log('   Email: admin@enishradio.com');
      console.log('   Password: admin123');
      console.log('   Please change the password after first login.');
    }

    // Seed social links if none exist
    const existingSocialLinks = await db.query.socialLinks.findMany();
    if (existingSocialLinks.length === 0) {
      const socialLinksData = [
        {
          platform: 'facebook',
          url: 'https://facebook.com/enishradio',
          displayName: 'Facebook',
          icon: 'facebook',
          order: 0
        },
        {
          platform: 'twitter',
          url: 'https://twitter.com/enishradio',
          displayName: 'Twitter',
          icon: 'twitter',
          order: 1
        },
        {
          platform: 'instagram',
          url: 'https://instagram.com/enishradio',
          displayName: 'Instagram',
          icon: 'instagram',
          order: 2
        },
        {
          platform: 'youtube',
          url: 'https://youtube.com/enishradio',
          displayName: 'YouTube',
          icon: 'youtube',
          order: 3
        }
      ];

      await db.insert(socialLinks).values(socialLinksData);
      console.log('✅ Social links seeded successfully!');
    } else {
      console.log('✅ Social links already exist, skipping seeding');
    }

    // Note: Stream metadata is now managed by RadioKing API
    console.log('ℹ️  Stream metadata is managed by RadioKing API, skipping seeding');

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();
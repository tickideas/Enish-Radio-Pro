import { eq, and, or } from 'drizzle-orm';
import { db } from '../db.js';
import { socialLinks } from '../schema.js';

class SocialLinkModel {
  // Get all social links
  static async getAll() {
    try {
      const result = await db.select().from(socialLinks).orderBy(socialLinks.order);
      return result;
    } catch (error) {
      console.error('Error fetching social links:', error);
      throw error;
    }
  }

  // Get active social links
  static async getActive() {
    try {
      const result = await db.select().from(socialLinks).where(eq(socialLinks.isActive, true)).orderBy(socialLinks.order);
      return result;
    } catch (error) {
      console.error('Error fetching active social links:', error);
      throw error;
    }
  }

  // Find social link by ID
  static async findById(id) {
    try {
      const result = await db.select().from(socialLinks).where(eq(socialLinks.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding social link by ID:', error);
      throw error;
    }
  }

  // Find social link by platform
  static async findByPlatform(platform) {
    try {
      const result = await db.select().from(socialLinks).where(eq(socialLinks.platform, platform)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding social link by platform:', error);
      throw error;
    }
  }

  // Create new social link
  static async create(socialLinkData) {
    try {
      const newSocialLink = {
        platform: socialLinkData.platform,
        url: socialLinkData.url,
        displayName: socialLinkData.displayName,
        icon: socialLinkData.icon,
        isActive: socialLinkData.isActive !== false,
        order: socialLinkData.order || 0
      };

      const result = await db.insert(socialLinks).values(newSocialLink).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating social link:', error);
      throw error;
    }
  }

  // Update social link
  static async update(id, socialLinkData) {
    try {
      const updateData = { ...socialLinkData };

      const result = await db.update(socialLinks)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(socialLinks.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating social link:', error);
      throw error;
    }
  }

  // Delete social link
  static async delete(id) {
    try {
      await db.delete(socialLinks).where(eq(socialLinks.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting social link:', error);
      throw error;
    }
  }

  // Update order of social links
  static async updateOrder(links) {
    try {
      const updates = links.map(link => 
        db.update(socialLinks)
          .set({ order: link.order, updatedAt: new Date() })
          .where(eq(socialLinks.id, link.id))
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error updating social link order:', error);
      throw error;
    }
  }
}

export default SocialLinkModel;
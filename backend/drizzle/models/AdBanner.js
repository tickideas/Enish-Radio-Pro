import { eq, and, or, lte, gte } from 'drizzle-orm';
import { db } from '../db.js';
import { adBanners } from '../schema.js';

class AdBannerModel {
  // Get all active ad banners (public)
  static async getActive() {
    try {
      const now = new Date();
      const result = await db.select().from(adBanners).where(
        and(
          eq(adBanners.isActive, true),
          lte(adBanners.startDate, now),
          gte(adBanners.endDate, now)
        )
      ).orderBy(adBanners.priority, adBanners.createdAt);
      return result;
    } catch (error) {
      console.error('Error fetching active ad banners:', error);
      throw error;
    }
  }

  // Get all ad banners (admin)
  static async getAll() {
    try {
      const result = await db.select().from(adBanners).orderBy(adBanners.createdAt);
      return result;
    } catch (error) {
      console.error('Error fetching all ad banners:', error);
      throw error;
    }
  }

  // Find ad banner by ID
  static async findById(id) {
    try {
      const result = await db.select().from(adBanners).where(eq(adBanners.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding ad banner by ID:', error);
      throw error;
    }
  }

  // Create new ad banner
  static async create(adBannerData) {
    try {
      const newAdBanner = {
        title: adBannerData.title,
        imageUrl: adBannerData.imageUrl,
        cloudinaryPublicId: adBannerData.cloudinaryPublicId,
        targetUrl: adBannerData.targetUrl,
        description: adBannerData.description,
        startDate: adBannerData.startDate,
        endDate: adBannerData.endDate,
        priority: adBannerData.priority || 0,
        isActive: adBannerData.isActive !== false
      };

      const result = await db.insert(adBanners).values(newAdBanner).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating ad banner:', error);
      throw error;
    }
  }

  // Update ad banner
  static async update(id, adBannerData) {
    try {
      const updateData = { ...adBannerData };

      const result = await db.update(adBanners)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(adBanners.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating ad banner:', error);
      throw error;
    }
  }

  // Delete ad banner
  static async delete(id) {
    try {
      await db.delete(adBanners).where(eq(adBanners.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting ad banner:', error);
      throw error;
    }
  }

  // Increment click count
  static async incrementClick(id) {
    try {
      const result = await db.update(adBanners)
        .set({ 
          clickCount: adBanners.clickCount + 1,
          updatedAt: new Date() 
        })
        .where(eq(adBanners.id, id))
        .returning({
          id: adBanners.id,
          clickCount: adBanners.clickCount
        });

      return result[0];
    } catch (error) {
      console.error('Error incrementing click count:', error);
      throw error;
    }
  }

  // Increment impression count
  static async incrementImpression(id) {
    try {
      const result = await db.update(adBanners)
        .set({ 
          impressionCount: adBanners.impressionCount + 1,
          updatedAt: new Date() 
        })
        .where(eq(adBanners.id, id))
        .returning({
          id: adBanners.id,
          impressionCount: adBanners.impressionCount
        });

      return result[0];
    } catch (error) {
      console.error('Error incrementing impression count:', error);
      throw error;
    }
  }

  // Get currently active banners
  static async getCurrentlyActive() {
    try {
      const now = new Date();
      const result = await db.select().from(adBanners).where(
        and(
          eq(adBanners.isActive, true),
          lte(adBanners.startDate, now),
          gte(adBanners.endDate, now)
        )
      ).orderBy(adBanners.priority, adBanners.createdAt);
      
      // Add isCurrentlyActive method to each result
      return result.map(banner => ({
        ...banner,
        isCurrentlyActive: () => {
          const now = new Date();
          return banner.isActive && banner.startDate <= now && banner.endDate >= now;
        }
      }));
    } catch (error) {
      console.error('Error getting currently active banners:', error);
      throw error;
    }
  }
}

export default AdBannerModel;
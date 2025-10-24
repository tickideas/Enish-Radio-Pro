import { eq, and, or, lte, gte, desc } from 'drizzle-orm';
import { db } from '../db.js';
import { streamMetadata } from '../schema.js';

class StreamMetadataModel {
  // Get current/active stream metadata
  static async getCurrent() {
    try {
      const now = new Date();
      const result = await db.select().from(streamMetadata).where(
        and(
          eq(streamMetadata.isActive, true),
          lte(streamMetadata.startTime, now),
          or(
            eq(streamMetadata.isLive, true),
            gte(streamMetadata.endTime, now)
          )
        )
      ).orderBy(streamMetadata.startTime).limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching current stream metadata:', error);
      throw error;
    }
  }

  // Get all stream metadata
  static async getAll() {
    try {
      const result = await db.select().from(streamMetadata).orderBy(desc(streamMetadata.startTime));
      return result;
    } catch (error) {
      console.error('Error fetching all stream metadata:', error);
      throw error;
    }
  }

  // Get active stream metadata
  static async getActive() {
    try {
      const result = await db.select().from(streamMetadata).where(eq(streamMetadata.isActive, true)).orderBy(desc(streamMetadata.startTime));
      return result;
    } catch (error) {
      console.error('Error fetching active stream metadata:', error);
      throw error;
    }
  }

  // Find stream metadata by ID
  static async findById(id) {
    try {
      const result = await db.select().from(streamMetadata).where(eq(streamMetadata.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding stream metadata by ID:', error);
      throw error;
    }
  }

  // Create new stream metadata
  static async create(streamData) {
    try {
      const newStream = {
        title: streamData.title,
        artist: streamData.artist,
        album: streamData.album,
        artworkUrl: streamData.artworkUrl,
        duration: streamData.duration,
        genre: streamData.genre,
        year: streamData.year,
        isLive: streamData.isLive !== false,
        startTime: streamData.startTime,
        endTime: streamData.endTime,
        source: streamData.source || 'radioking',
        streamUrl: streamData.streamUrl,
        isActive: streamData.isActive !== false
      };

      const result = await db.insert(streamMetadata).values(newStream).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating stream metadata:', error);
      throw error;
    }
  }

  // Update stream metadata
  static async update(id, streamData) {
    try {
      const updateData = { ...streamData };

      const result = await db.update(streamMetadata)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(streamMetadata.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating stream metadata:', error);
      throw error;
    }
  }

  // Delete stream metadata
  static async delete(id) {
    try {
      await db.delete(streamMetadata).where(eq(streamMetadata.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting stream metadata:', error);
      throw error;
    }
  }

  // Get currently playing track
  static async getCurrentlyPlaying() {
    try {
      const now = new Date();
      const result = await db.select().from(streamMetadata).where(
        and(
          eq(streamMetadata.isActive, true),
          lte(streamMetadata.startTime, now),
          or(
            eq(streamMetadata.isLive, true),
            gte(streamMetadata.endTime, now)
          )
        )
      ).orderBy(streamMetadata.startTime).limit(1);
      
      if (result.length === 0) return null;
      
      const track = result[0];
      
      // Add isCurrentlyPlaying method
      return {
        ...track,
        isCurrentlyPlaying: () => {
          const now = new Date();
          return track.isActive && track.startTime <= now && (!track.endTime || track.endTime >= now);
        }
      };
    } catch (error) {
      console.error('Error getting currently playing track:', error);
      throw error;
    }
  }

  // Get recent tracks
  static async getRecent(limit = 10) {
    try {
      const result = await db.select().from(streamMetadata)
        .where(eq(streamMetadata.isActive, true))
        .orderBy(desc(streamMetadata.startTime))
        .limit(limit);
      return result;
    } catch (error) {
      console.error('Error fetching recent tracks:', error);
      throw error;
    }
  }
}

export default StreamMetadataModel;
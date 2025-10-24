import express from 'express';
import StreamMetadataModel from '../drizzle/models/StreamMetadata.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/stream/metadata - Get current stream metadata (public)
router.get('/', async (req, res) => {
  try {
    const streamMetadata = await StreamMetadataModel.getCurrent();
    
    res.json({
      success: true,
      data: streamMetadata
    });
  } catch (error) {
    console.error('Error fetching current stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current stream metadata'
    });
  }
});

// GET /api/stream/metadata/all - Get all stream metadata (admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const streamMetadata = await StreamMetadataModel.getAll();
    
    res.json({
      success: true,
      data: streamMetadata,
      count: streamMetadata.length
    });
  } catch (error) {
    console.error('Error fetching all stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch all stream metadata'
    });
  }
});

// GET /api/stream/metadata/active - Get active stream metadata (admin only)
router.get('/active', adminAuth, async (req, res) => {
  try {
    const streamMetadata = await StreamMetadataModel.getActive();
    
    res.json({
      success: true,
      data: streamMetadata,
      count: streamMetadata.length
    });
  } catch (error) {
    console.error('Error fetching active stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active stream metadata'
    });
  }
});

// GET /api/stream/metadata/admin - Get all stream metadata for admin dashboard (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const streamMetadata = await StreamMetadataModel.getAll();
    
    res.json({
      success: true,
      data: streamMetadata,
      count: streamMetadata.length
    });
  } catch (error) {
    console.error('Error fetching stream metadata for admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream metadata for admin dashboard'
    });
  }
});

// GET /api/stream/metadata/current - Get currently playing track (public)
router.get('/current', async (req, res) => {
  try {
    const currentTrack = await StreamMetadataModel.getCurrentlyPlaying();
    
    res.json({
      success: true,
      data: currentTrack
    });
  } catch (error) {
    console.error('Error fetching currently playing track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch currently playing track'
    });
  }
});

// GET /api/stream/metadata/recent - Get recent tracks (public)
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentTracks = await StreamMetadataModel.getRecent(limit);
    
    res.json({
      success: true,
      data: recentTracks,
      count: recentTracks.length
    });
  } catch (error) {
    console.error('Error fetching recent tracks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent tracks'
    });
  }
});

// GET /api/stream/metadata/:id - Get single stream metadata (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const streamMetadata = await StreamMetadataModel.findById(req.params.id);
    
    if (!streamMetadata) {
      return res.status(404).json({
        success: false,
        error: 'Stream metadata not found'
      });
    }
    
    res.json({
      success: true,
      data: streamMetadata
    });
  } catch (error) {
    console.error('Error fetching stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream metadata'
    });
  }
});

// POST /api/stream/metadata - Create new stream metadata (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, artist, album, artworkUrl, duration, genre, year, isLive = true, startTime, endTime, source = 'radioking', streamUrl } = req.body;
    
    if (!title || !artist || !startTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, artist, startTime'
      });
    }
    
    const streamData = {
      title,
      artist,
      album,
      artworkUrl,
      duration,
      genre,
      year,
      isLive,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      source,
      streamUrl
    };
    
    const streamMetadata = await StreamMetadataModel.create(streamData);
    
    res.status(201).json({
      success: true,
      data: streamMetadata,
      message: 'Stream metadata created successfully'
    });
  } catch (error) {
    console.error('Error creating stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stream metadata'
    });
  }
});

// PUT /api/stream/metadata/:id - Update stream metadata (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, artist, album, artworkUrl, duration, genre, year, isLive, startTime, endTime, source, streamUrl, isActive } = req.body;
    
    const streamMetadata = await StreamMetadataModel.findById(req.params.id);
    if (!streamMetadata) {
      return res.status(404).json({
        success: false,
        error: 'Stream metadata not found'
      });
    }
    
    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (artist) updateData.artist = artist;
    if (album) updateData.album = album;
    if (artworkUrl) updateData.artworkUrl = artworkUrl;
    if (duration) updateData.duration = duration;
    if (genre) updateData.genre = genre;
    if (year) updateData.year = year;
    if (isLive !== undefined) updateData.isLive = isLive;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = endTime ? new Date(endTime) : null;
    if (source) updateData.source = source;
    if (streamUrl) updateData.streamUrl = streamUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    const updatedStreamMetadata = await StreamMetadataModel.update(req.params.id, updateData);
    
    res.json({
      success: true,
      data: updatedStreamMetadata,
      message: 'Stream metadata updated successfully'
    });
  } catch (error) {
    console.error('Error updating stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stream metadata'
    });
  }
});

// DELETE /api/stream/metadata/:id - Delete stream metadata (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const streamMetadata = await StreamMetadataModel.findById(req.params.id);
    if (!streamMetadata) {
      return res.status(404).json({
        success: false,
        error: 'Stream metadata not found'
      });
    }
    
    await StreamMetadataModel.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Stream metadata deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete stream metadata'
    });
  }
});

export default router;
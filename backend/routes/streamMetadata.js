const express = require('express');
const router = express.Router();
const { StreamMetadata } = require('../models/StreamMetadata');
const { adminAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/stream/metadata - Get current stream metadata (public)
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const currentMetadata = await StreamMetadata.findOne({
      where: {
        isActive: true,
        startTime: { [Op.lte]: now },
        [Op.or]: [
          { endTime: { [Op.is]: null } },
          { endTime: { [Op.gte]: now } }
        ]
      },
      order: [['startTime', 'DESC']]
    });
    
    if (!currentMetadata) {
      // Return default metadata if no active track found
      return res.json({
        success: true,
        data: {
          title: 'Enish Radio Live',
          artist: '24/7 Music Stream',
          album: 'Live Broadcast',
          isLive: true,
          source: 'radioking'
        }
      });
    }
    
    res.json({
      success: true,
      data: currentMetadata
    });
  } catch (error) {
    console.error('Error fetching stream metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stream metadata'
    });
  }
});

// GET /api/stream/metadata/history - Get recent metadata history (public)
router.get('/history', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const metadata = await StreamMetadata.findAll({
      where: { isActive: true },
      order: [['startTime', 'DESC']],
      limit: parseInt(limit),
      attributes: ['title', 'artist', 'album', 'startTime', 'endTime']
    });
    
    res.json({
      success: true,
      data: metadata,
      count: metadata.length
    });
  } catch (error) {
    console.error('Error fetching metadata history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metadata history'
    });
  }
});

// GET /api/stream/metadata/admin - Get all metadata (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const metadata = await StreamMetadata.findAndCountAll({
      order: [['startTime', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    const total = metadata.count;
    
    res.json({
      success: true,
      data: metadata,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metadata'
    });
  }
});

// GET /api/stream/metadata/:id - Get single metadata (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const metadata = await StreamMetadata.findByPk(req.params.id);
    
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Metadata not found'
      });
    }
    
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch metadata'
    });
  }
});

// POST /api/stream/metadata - Create new metadata (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      artist, 
      album, 
      artworkUrl, 
      duration, 
      genre, 
      year, 
      source, 
      streamUrl 
    } = req.body;
    
    if (!title || !artist || !source) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, artist, source'
      });
    }
    
    // Deactivate previous live tracks if this is a new live track
    if (source === 'manual' || source === 'api') {
      await StreamMetadata.updateMany(
        { isLive: true, source },
        { isLive: false, endTime: new Date() }
      );
    }
    
    const metadata = new StreamMetadata({
      title,
      artist,
      album,
      artworkUrl,
      duration,
      genre,
      year,
      source,
      streamUrl,
      startTime: new Date(),
      isLive: true
    });
    
    await metadata.save();
    
    res.status(201).json({
      success: true,
      data: metadata,
      message: 'Stream metadata created successfully'
    });
  } catch (error) {
    console.error('Error creating metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create metadata'
    });
  }
});

// PUT /api/stream/metadata/:id - Update metadata (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { 
      title, 
      artist, 
      album, 
      artworkUrl, 
      duration, 
      genre, 
      year, 
      source, 
      streamUrl, 
      isActive,
      endTime 
    } = req.body;
    
    const metadata = await StreamMetadata.findByPk(req.params.id);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Metadata not found'
      });
    }
    
    // Update fields
    if (title) metadata.title = title;
    if (artist) metadata.artist = artist;
    if (album) metadata.album = album;
    if (artworkUrl) metadata.artworkUrl = artworkUrl;
    if (duration) metadata.duration = duration;
    if (genre) metadata.genre = genre;
    if (year) metadata.year = year;
    if (source) metadata.source = source;
    if (streamUrl) metadata.streamUrl = streamUrl;
    if (isActive !== undefined) metadata.isActive = isActive;
    if (endTime) metadata.endTime = new Date(endTime);
    
    await metadata.save();
    
    res.json({
      success: true,
      data: metadata,
      message: 'Stream metadata updated successfully'
    });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update metadata'
    });
  }
});

// DELETE /api/stream/metadata/:id - Delete metadata (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const metadata = await StreamMetadata.findByPk(req.params.id);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Metadata not found'
      });
    }
    
    await StreamMetadata.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Stream metadata deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete metadata'
    });
  }
});

// POST /api/stream/metadata/:id/end - End current track (admin only)
router.post('/:id/end', adminAuth, async (req, res) => {
  try {
    const metadata = await StreamMetadata.findByPk(req.params.id);
    if (!metadata) {
      return res.status(404).json({
        success: false,
        error: 'Metadata not found'
      });
    }
    
    metadata.isLive = false;
    metadata.endTime = new Date();
    await metadata.save();
    
    res.json({
      success: true,
      data: metadata,
      message: 'Track ended successfully'
    });
  } catch (error) {
    console.error('Error ending track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end track'
    });
  }
});

module.exports = router;
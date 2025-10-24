const express = require('express');
const router = express.Router();
const { SocialLink } = require('../models/SocialLink');
const { adminAuth } = require('../middleware/auth');

// GET /api/social-links - Get all social links (public)
router.get('/', async (req, res) => {
  try {
    const socialLinks = await SocialLink.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    
    res.json({
      success: true,
      data: socialLinks,
      count: socialLinks.length
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social links'
    });
  }
});

// GET /api/social-links/admin - Get all social links (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const socialLinks = await SocialLink.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: socialLinks,
      count: socialLinks.length
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social links'
    });
  }
});

// GET /api/social-links/:id - Get single social link (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const socialLink = await SocialLink.findByPk(req.params.id);
    
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        error: 'Social link not found'
      });
    }
    
    res.json({
      success: true,
      data: socialLink
    });
  } catch (error) {
    console.error('Error fetching social link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social link'
    });
  }
});

// POST /api/social-links - Create new social link (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { platform, url, displayName, icon, order } = req.body;
    
    // Check if platform already exists
    const existingLink = await SocialLink.findOne({ where: { platform } });
    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'Platform already exists'
      });
    }
    
    const socialLink = new SocialLink({
      platform,
      url,
      displayName,
      icon,
      order: order || 0
    });
    
    await socialLink.save();
    
    res.status(201).json({
      success: true,
      data: socialLink,
      message: 'Social link created successfully'
    });
  } catch (error) {
    console.error('Error creating social link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create social link'
    });
  }
});

// PUT /api/social-links/:id - Update social link (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { platform, url, displayName, icon, order, isActive } = req.body;
    
    const socialLink = await SocialLink.findByPk(req.params.id);
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        error: 'Social link not found'
      });
    }
    
    // Check if platform is being changed to one that already exists
    if (platform && platform !== socialLink.platform) {
      const existingLink = await SocialLink.findOne({ 
        platform, 
        _id: { $ne: req.params.id } 
      });
      if (existingLink) {
        return res.status(400).json({
          success: false,
          error: 'Platform already exists'
        });
      }
    }
    
    // Update fields
    if (platform) socialLink.platform = platform;
    if (url) socialLink.url = url;
    if (displayName) socialLink.displayName = displayName;
    if (icon) socialLink.icon = icon;
    if (order !== undefined) socialLink.order = order;
    if (isActive !== undefined) socialLink.isActive = isActive;
    
    await socialLink.save();
    
    res.json({
      success: true,
      data: socialLink,
      message: 'Social link updated successfully'
    });
  } catch (error) {
    console.error('Error updating social link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update social link'
    });
  }
});

// DELETE /api/social-links/:id - Delete social link (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const socialLink = await SocialLink.findById(req.params.id);
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        error: 'Social link not found'
      });
    }
    
    await SocialLink.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Social link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting social link:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete social link'
    });
  }
});

// PUT /api/social-links/reorder - Reorder social links (admin only)
router.put('/reorder', adminAuth, async (req, res) => {
  try {
    const { links } = req.body; // Array of { id, order }
    
    if (!Array.isArray(links)) {
      return res.status(400).json({
        success: false,
        error: 'Links must be an array'
      });
    }
    
    // Update order for each link
    const updatePromises = links.map(({ id, order }) => 
      SocialLink.findByIdAndUpdate(id, { order })
    );
    
    await Promise.all(updatePromises);
    
    res.json({
      success: true,
      message: 'Social links reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering social links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder social links'
    });
  }
});

module.exports = router;
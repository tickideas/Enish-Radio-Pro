import express from 'express';
import SocialLinkModel from '../drizzle/models/SocialLink.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/social-links - Get all social links (public)
router.get('/', async (req, res) => {
  try {
    const socialLinks = await SocialLinkModel.getAll();
    
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

// GET /api/social-links/active - Get active social links (public)
router.get('/active', async (req, res) => {
  try {
    const socialLinks = await SocialLinkModel.getActive();
    
    res.json({
      success: true,
      data: socialLinks,
      count: socialLinks.length
    });
  } catch (error) {
    console.error('Error fetching active social links:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active social links'
    });
  }
});

// GET /api/social-links/admin - Get all social links for admin dashboard (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const socialLinks = await SocialLinkModel.getAll();
    
    res.json({
      success: true,
      data: socialLinks,
      count: socialLinks.length
    });
  } catch (error) {
    console.error('Error fetching social links for admin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social links for admin dashboard'
    });
  }
});

// GET /api/social-links/:id - Get single social link (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const socialLink = await SocialLinkModel.findById(req.params.id);
    
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

// GET /api/social-links/platform/:platform - Get social link by platform (admin only)
router.get('/platform/:platform', adminAuth, async (req, res) => {
  try {
    const socialLink = await SocialLinkModel.findByPlatform(req.params.platform);
    
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
    console.error('Error fetching social link by platform:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch social link'
    });
  }
});

// POST /api/social-links - Create new social link (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { platform, url, displayName, icon, order = 0 } = req.body;
    
    if (!platform || !url || !displayName || !icon) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: platform, url, displayName, icon'
      });
    }
    
    // Check if platform already exists
    const existingLink = await SocialLinkModel.findByPlatform(platform);
    if (existingLink) {
      return res.status(400).json({
        success: false,
        error: 'Social link for this platform already exists'
      });
    }
    
    const socialLink = await SocialLinkModel.create({
      platform,
      url,
      displayName,
      icon,
      order
    });
    
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
    const { platform, url, displayName, icon, isActive, order } = req.body;
    
    const socialLink = await SocialLinkModel.findById(req.params.id);
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        error: 'Social link not found'
      });
    }
    
    // Check if platform is being changed and if it already exists
    if (platform && platform !== socialLink.platform) {
      const existingLink = await SocialLinkModel.findByPlatform(platform);
      if (existingLink) {
        return res.status(400).json({
          success: false,
          error: 'Social link for this platform already exists'
        });
      }
    }
    
    // Update fields
    const updateData = {};
    if (platform) updateData.platform = platform;
    if (url) updateData.url = url;
    if (displayName) updateData.displayName = displayName;
    if (icon) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;
    
    const updatedSocialLink = await SocialLinkModel.update(req.params.id, updateData);
    
    res.json({
      success: true,
      data: updatedSocialLink,
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

// PUT /api/social-links/order - Update order of multiple social links (admin only)
router.put('/order', adminAuth, async (req, res) => {
  try {
    const { links } = req.body;
    
    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Links array is required'
      });
    }
    
    // Validate links format
    for (const link of links) {
      if (!link.id || typeof link.order !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Each link must have id and order properties'
        });
      }
    }
    
    await SocialLinkModel.updateOrder(links);
    
    res.json({
      success: true,
      message: 'Social link order updated successfully'
    });
  } catch (error) {
    console.error('Error updating social link order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update social link order'
    });
  }
});

// DELETE /api/social-links/:id - Delete social link (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const socialLink = await SocialLinkModel.findById(req.params.id);
    if (!socialLink) {
      return res.status(404).json({
        success: false,
        error: 'Social link not found'
      });
    }
    
    await SocialLinkModel.delete(req.params.id);
    
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

export default router;
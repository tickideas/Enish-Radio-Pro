import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import AdBannerModel from '../drizzle/models/AdBanner.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// GET /api/ads - Get active ad banners (public)
router.get('/', async (req, res) => {
  try {
    const adBanners = await AdBannerModel.getActive();
    
    res.json({
      success: true,
      data: adBanners,
      count: adBanners.length
    });
  } catch (error) {
    console.error('Error fetching ad banners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad banners'
    });
  }
});

// GET /api/ads/admin - Get all ad banners (admin only)
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const adBanners = await AdBannerModel.getAll();
    
    res.json({
      success: true,
      data: adBanners,
      count: adBanners.length
    });
  } catch (error) {
    console.error('Error fetching ad banners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad banners'
    });
  }
});

// GET /api/ads/:id - Get single ad banner (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const adBanner = await AdBannerModel.findById(req.params.id);
    
    if (!adBanner) {
      return res.status(404).json({
        success: false,
        error: 'Ad banner not found'
      });
    }
    
    res.json({
      success: true,
      data: adBanner
    });
  } catch (error) {
    console.error('Error fetching ad banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad banner'
    });
  }
});

// POST /api/ads - Create new ad banner (admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, targetUrl, description, startDate, endDate, priority } = req.body;
    
    if (!title || !targetUrl || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, targetUrl, startDate, endDate'
      });
    }
    
    let imageUrl = '';
    let cloudinaryPublicId = '';
    
    // Upload image to Cloudinary if provided
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              resource_type: 'image',
              folder: 'enish-radio/ads',
              transformation: [
                { width: 1200, height: 400, crop: 'fill', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          ).end(req.file.buffer);
        });
        
        imageUrl = result.secure_url;
        cloudinaryPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image'
        });
      }
    }
    
    const adBanner = await AdBannerModel.create({
      title,
      imageUrl,
      cloudinaryPublicId,
      targetUrl,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      priority: priority || 0
    });
    
    res.status(201).json({
      success: true,
      data: adBanner,
      message: 'Ad banner created successfully'
    });
  } catch (error) {
    console.error('Error creating ad banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create ad banner'
    });
  }
});

// PUT /api/ads/:id - Update ad banner (admin only)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, targetUrl, description, startDate, endDate, priority, isActive } = req.body;
    
    const adBanner = await AdBannerModel.findById(req.params.id);
    if (!adBanner) {
      return res.status(404).json({
        success: false,
        error: 'Ad banner not found'
      });
    }
    
    // Upload new image if provided
    if (req.file) {
      try {
        // Delete old image from Cloudinary
        if (adBanner.cloudinaryPublicId) {
          await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(adBanner.cloudinaryPublicId, (error, result) => {
              if (error) console.error('Error deleting old image:', error);
              resolve(result);
            });
          });
        }
        
        // Upload new image
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { 
              resource_type: 'image',
              folder: 'enish-radio/ads',
              transformation: [
                { width: 1200, height: 400, crop: 'fill', quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          ).end(req.file.buffer);
        });
        
        adBanner.imageUrl = result.secure_url;
        adBanner.cloudinaryPublicId = result.public_id;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Failed to upload image'
        });
      }
    }
    
    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (targetUrl) updateData.targetUrl = targetUrl;
    if (description) updateData.description = description;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (req.file) {
      updateData.imageUrl = adBanner.imageUrl;
      updateData.cloudinaryPublicId = adBanner.cloudinaryPublicId;
    }
    
    const updatedAdBanner = await AdBannerModel.update(req.params.id, updateData);
    
    res.json({
      success: true,
      data: updatedAdBanner,
      message: 'Ad banner updated successfully'
    });
  } catch (error) {
    console.error('Error updating ad banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update ad banner'
    });
  }
});

// DELETE /api/ads/:id - Delete ad banner (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const adBanner = await AdBannerModel.findById(req.params.id);
    if (!adBanner) {
      return res.status(404).json({
        success: false,
        error: 'Ad banner not found'
      });
    }
    
    // Delete image from Cloudinary
    if (adBanner.cloudinaryPublicId) {
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(adBanner.cloudinaryPublicId, (error, result) => {
          if (error) console.error('Error deleting image:', error);
          resolve(result);
        });
      });
    }
    
    await AdBannerModel.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Ad banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ad banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete ad banner'
    });
  }
});

// POST /api/ads/:id/click - Track ad click (public)
router.post('/:id/click', async (req, res) => {
  try {
    const adBanner = await AdBannerModel.findById(req.params.id);
    if (!adBanner) {
      return res.status(404).json({
        success: false,
        error: 'Ad banner not found'
      });
    }
    
    // Increment click count
    const updatedBanner = await AdBannerModel.incrementClick(req.params.id);
    
    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking ad click:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track click'
    });
  }
});

export default router;
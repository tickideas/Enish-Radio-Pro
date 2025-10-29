import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import SocialLinkModel from '../drizzle/models/SocialLink.js';
import AdBannerModel from '../drizzle/models/AdBanner.js';

const router = express.Router();

// GET /api/analytics/overview - Get basic analytics overview (admin only)
router.get('/overview', adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Social links analytics
    const totalSocialLinks = await SocialLinkModel.getAll();
    const activeSocialLinks = totalSocialLinks.filter(link => link.isActive);

    // Ad banners analytics
    const totalAds = await AdBannerModel.getAll();
    const activeAds = totalAds.filter(ad => ad.isActive);
    const totalClicks = totalAds.reduce((sum, ad) => sum + ad.clickCount, 0);

    // Weekly ad clicks
    const weeklyClicks = totalAds
      .filter(ad => ad.createdAt >= startOfWeek)
      .reduce((sum, ad) => sum + ad.clickCount, 0);

    // Monthly ad clicks
    const monthlyClicks = totalAds
      .filter(ad => ad.createdAt >= startOfMonth)
      .reduce((sum, ad) => sum + ad.clickCount, 0);

    res.json({
      success: true,
      data: {
        socialLinks: {
          total: totalSocialLinks.length,
          active: activeSocialLinks.length
        },
        ads: {
          total: totalAds.length,
          active: activeAds.length,
          totalClicks,
          weeklyClicks,
          monthlyClicks
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
});

// GET /api/analytics/ad-clicks - Get ad click analytics (admin only)
router.get('/ad-clicks', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    let startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const allAds = await AdBannerModel.getAll();
    const filteredAds = allAds.filter(ad => ad.createdAt >= startDate);
    
    // Sort by click count descending
    const sortedAds = filteredAds.sort((a, b) => b.clickCount - a.clickCount);

    res.json({
      success: true,
      data: sortedAds.map(ad => ({
        id: ad.id,
        title: ad.title,
        clickCount: ad.clickCount,
        createdAt: ad.createdAt
      })),
      timeframe
    });
  } catch (error) {
    console.error('Error fetching ad clicks analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ad clicks analytics'
    });
  }
});

export default router;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdBanner = sequelize.define('AdBanner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cloudinaryPublicId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetUrl: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  clickCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  impressionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  indexes: [
    {
      fields: ['isActive', 'startDate', 'endDate']
    },
    {
      fields: ['priority']
    }
  ]
});

// Virtual field to check if campaign is currently active
AdBanner.prototype.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
};

module.exports = AdBanner;
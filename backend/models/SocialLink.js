const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SocialLink = sequelize.define('SocialLink', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'twitter', 'instagram', 'youtube', 'website', 'tiktok', 'linkedin'),
    allowNull: false,
    unique: true
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
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
      unique: true,
      fields: ['platform']
    }
  ]
});

module.exports = SocialLink;
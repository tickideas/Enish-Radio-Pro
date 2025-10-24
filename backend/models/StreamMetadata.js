const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StreamMetadata = sequelize.define('StreamMetadata', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  artist: {
    type: DataTypes.STRING,
    allowNull: false
  },
  album: {
    type: DataTypes.STRING,
    allowNull: true
  },
  artworkUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  },
  genre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 1
    }
  },
  isLive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  source: {
    type: DataTypes.ENUM('radioking', 'manual', 'api'),
    defaultValue: 'radioking',
    allowNull: false
  },
  streamUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
      fields: ['isActive', 'startTime']
    },
    {
      fields: ['source']
    }
  ]
});

// Virtual field to check if track is currently playing
StreamMetadata.prototype.isCurrentlyPlaying = function() {
  const now = new Date();
  return this.isActive && this.startTime <= now && (!this.endTime || this.endTime >= now);
};

module.exports = StreamMetadata;
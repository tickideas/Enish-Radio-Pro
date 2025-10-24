const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'moderator'),
    defaultValue: 'admin',
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
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
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  },
  instanceMethods: {
    comparePassword: async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    },
    toJSON: function() {
      const values = Object.assign({}, this.get());
      delete values.password;
      return values;
    }
  }
});

module.exports = User;
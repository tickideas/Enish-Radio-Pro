import { eq, and, or } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { users } from '../schema.js';

class UserModel {
  // Find user by email
  static async findByEmail(email) {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find all users (excluding password)
  static async findAll() {
    try {
      const result = await db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).orderBy(users.createdAt);
      return result;
    } catch (error) {
      console.error('Error finding all users:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const newUser = {
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'admin',
        isActive: userData.isActive !== false
      };

      const result = await db.insert(users).values(newUser).returning({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt
      });

      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  static async update(id, userData) {
    try {
      const updateData = { ...userData };
      
      // Hash password if provided
      if (updateData.password) {
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(updateData.password, saltRounds);
      }

      const result = await db.update(users)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          lastLogin: users.lastLogin,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        });

      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Update user password
  static async updatePassword(id, hashedPassword) {
    try {
      const result = await db.update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          email: users.email,
          role: users.role,
          isActive: users.isActive
        });

      return result[0];
    } catch (error) {
      console.error('Error updating user password:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Count users by role
  static async countByRole(role, isActive = true) {
    try {
      const result = await db.select({ count: users.id })
        .from(users)
        .where(and(
          eq(users.role, role),
          eq(users.isActive, isActive)
        ));
      return result.length;
    } catch (error) {
      console.error('Error counting users by role:', error);
      throw error;
    }
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      console.error('Error comparing password:', error);
      throw error;
    }
  }

  // Update last login
  static async updateLastLogin(id) {
    try {
      await db.update(users)
        .set({ lastLogin: new Date(), updatedAt: new Date() })
        .where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error('Error updating last login:', error);
      throw error;
    }
  }
}

export default UserModel;
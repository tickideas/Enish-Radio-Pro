const UserModel = require('../../drizzle/models/User');
const testDatabase = require('../testDatabase');

describe('UserModel', () => {
  beforeEach(async () => {
    await testDatabase.cleanup();
  });

  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        role: 'user',
        isActive: true,
      };

      const user = await UserModel.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.password).toBe(userData.password);
      expect(user.role).toBe(userData.role);
      expect(user.isActive).toBe(userData.isActive);
      expect(user.id).toBeValidUUID();
      expect(user.createdAt).toBeIsoDateString();
      expect(user.updatedAt).toBeIsoDateString();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        role: 'user',
      };

      await UserModel.create(userData);
      
      await expect(UserModel.create(userData))
        .rejects
        .toThrow();
    });

    it('should throw error for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        role: 'user',
      };

      await expect(UserModel.create(userData))
        .rejects
        .toThrow();
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        role: 'user',
      };

      await expect(UserModel.create(userData))
        .rejects
        .toThrow();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const createdUser = await testDatabase.createTestUser({
        email: 'find@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const user = await UserModel.findById(createdUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(createdUser.email);
    });

    it('should return null when user not found', async () => {
      const user = await UserModel.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const createdUser = await testDatabase.createTestUser({
        email: 'email@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const user = await UserModel.findByEmail(createdUser.email);

      expect(user).toBeDefined();
      expect(user.id).toBe(createdUser.id);
      expect(user.email).toBe(createdUser.email);
    });

    it('should return null when user not found by email', async () => {
      const user = await UserModel.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user with valid data', async () => {
      const createdUser = await testDatabase.createTestUser({
        email: 'update@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const updateData = {
        role: 'admin',
        isActive: false,
      };

      const updatedUser = await UserModel.update(createdUser.id, updateData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.role).toBe(updateData.role);
      expect(updatedUser.isActive).toBe(updateData.isActive);
      expect(updatedUser.email).toBe(createdUser.email); // Should not change
    });

    it('should throw error when updating non-existent user', async () => {
      const updateData = {
        role: 'admin',
        isActive: false,
      };

      await expect(UserModel.update('non-existent-id', updateData))
        .rejects
        .toThrow();
    });

    it('should not allow updating email to duplicate', async () => {
      await testDatabase.createTestUser({
        email: 'first@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const secondUser = await testDatabase.createTestUser({
        email: 'second@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const updateData = {
        email: 'first@example.com',
      };

      await expect(UserModel.update(secondUser.id, updateData))
        .rejects
        .toThrow();
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      const createdUser = await testDatabase.createTestUser({
        email: 'delete@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const deletedUser = await UserModel.delete(createdUser.id);

      expect(deletedUser).toBeDefined();
      expect(deletedUser.id).toBe(createdUser.id);

      // Verify user is actually deleted
      const user = await UserModel.findById(createdUser.id);
      expect(user).toBeNull();
    });

    it('should throw error when deleting non-existent user', async () => {
      await expect(UserModel.delete('non-existent-id'))
        .rejects
        .toThrow();
    });
  });

  describe('authenticate', () => {
    it('should authenticate with correct credentials', async () => {
      const userData = {
        email: 'auth@example.com',
        password: 'SecurePass123!',
        role: 'user',
      };

      const createdUser = await testDatabase.createTestUser(userData);

      const authenticatedUser = await UserModel.authenticate(
        userData.email,
        userData.password
      );

      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser.id).toBe(createdUser.id);
      expect(authenticatedUser.email).toBe(createdUser.email);
    });

    it('should return null with incorrect password', async () => {
      const userData = {
        email: 'wrongpass@example.com',
        password: 'SecurePass123!',
        role: 'user',
      };

      await testDatabase.createTestUser(userData);

      const authenticatedUser = await UserModel.authenticate(
        userData.email,
        'wrongpassword'
      );

      expect(authenticatedUser).toBeNull();
    });

    it('should return null with non-existent email', async () => {
      const authenticatedUser = await UserModel.authenticate(
        'nonexistent@example.com',
        'anypassword'
      );

      expect(authenticatedUser).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const userData = {
        email: 'inactive@example.com',
        password: 'SecurePass123!',
        role: 'user',
        isActive: false,
      };

      await testDatabase.createTestUser(userData);

      const authenticatedUser = await UserModel.authenticate(
        userData.email,
        userData.password
      );

      expect(authenticatedUser).toBeNull();
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      // Create multiple users
      const users = [];
      for (let i = 0; i < 5; i++) {
        users.push(await testDatabase.createTestUser({
          email: `user${i}@example.com`,
          password: 'SecurePass123!',
          role: 'user',
        }));
      }

      const result = await UserModel.getUsers({ page: 1, limit: 3 });

      expect(result).toBeDefined();
      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it('should filter users by role', async () => {
      await testDatabase.createTestUser({
        email: 'user@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      await testDatabase.createTestUser({
        email: 'admin@example.com',
        password: 'SecurePass123!',
        role: 'admin',
      });

      const result = await UserModel.getUsers({
        page: 1,
        limit: 10,
        filters: { role: 'admin' },
      });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].role).toBe('admin');
      expect(result.total).toBe(1);
    });

    it('should search users by email', async () => {
      await testDatabase.createTestUser({
        email: 'john@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      await testDatabase.createTestUser({
        email: 'jane@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const result = await UserModel.getUsers({
        page: 1,
        limit: 10,
        search: 'john',
      });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].email).toBe('john@example.com');
      expect(result.total).toBe(1);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const createdUser = await testDatabase.createTestUser({
        email: 'login@example.com',
        password: 'SecurePass123!',
        role: 'user',
      });

      const originalLastLogin = createdUser.lastLogin;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      const updatedUser = await UserModel.updateLastLogin(createdUser.id);

      expect(updatedUser).toBeDefined();
      expect(updatedUser.lastLogin).not.toBe(originalLastLogin);
      expect(updatedUser.lastLogin).toBeIsoDateString();
    });

    it('should throw error when updating non-existent user', async () => {
      await expect(UserModel.updateLastLogin('non-existent-id'))
        .rejects
        .toThrow();
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', async () => {
      const strongPassword = 'SecurePass123!';
      const isValid = await UserModel.validatePassword(strongPassword);
      expect(isValid).toBe(true);
    });

    it('should reject weak passwords', async () => {
      const weakPasswords = [
        'weak',
        'password',
        '123456',
        'short',
        'lowercase',
        'UPPERCASE',
        '1234567890',
        'NoSpecialChars1',
      ];

      for (const password of weakPasswords) {
        const isValid = await UserModel.validatePassword(password);
        expect(isValid).toBe(false);
      }
    });
  });
});
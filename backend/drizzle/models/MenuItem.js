import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { menuItems } from '../schema.js';
import { eq } from 'drizzle-orm';

const TABLE_MISSING_CODE = '42P01';
const TYPE_MISSING_CODE = '42704';

function isMissingTable(error) {
  const code = error?.code || error?.cause?.code;
  return code === TABLE_MISSING_CODE;
}

function isMissingType(error) {
  const code = error?.code || error?.cause?.code;
  return code === TYPE_MISSING_CODE;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return value === 'true';
  return Boolean(value);
}

function parseOrder(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const coerced = Number.parseInt(value, 10);
  return Number.isFinite(coerced) ? coerced : fallback;
}

class MenuItemModel {
  /**
   * Ensure supporting enum + table exist (handles first-run scenarios)
   */
  static async ensureTable() {
    await db.execute(`
      DO $$ BEGIN
        CREATE TYPE menu_item_type AS ENUM ('internal', 'external', 'action');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        subtitle VARCHAR(255),
        type menu_item_type NOT NULL DEFAULT 'internal',
        target VARCHAR(500) NOT NULL,
        icon VARCHAR(50) NOT NULL DEFAULT 'menu',
        is_active BOOLEAN NOT NULL DEFAULT true,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  /**
   * Fetch all menu items sorted by order
   * @returns {Promise<Array>} menu items
   */
  static async getAll() {
    try {
      return await db.select().from(menuItems).orderBy(menuItems.order);
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table missing. Creating table and retrying.');
        await this.ensureTable();
        return await db.select().from(menuItems).orderBy(menuItems.order);
      }
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  /**
   * Fetch all active menu items sorted by order
   * @returns {Promise<Array>} active menu items
   */
  static async getActive() {
    try {
      return await db.select().from(menuItems).where(eq(menuItems.isActive, true)).orderBy(menuItems.order);
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table missing when fetching active items. Creating table and retrying.');
        await this.ensureTable();
        return await db.select().from(menuItems).where(eq(menuItems.isActive, true)).orderBy(menuItems.order);
      }
      console.error('Error fetching active menu items:', error);
      throw error;
    }
  }

  /**
   * Find menu item by id
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table missing when looking up item by id. Creating table and retrying.');
        await this.ensureTable();
        const result = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
        return result[0] || null;
      }
      console.error('Error finding menu item by id:', error);
      throw error;
    }
  }

  /**
   * Create menu item
   * @param {Object} menuItemData
   * @returns {Promise<Object>}
   */
  static async create(menuItemData) {
    const newMenuItem = {
      id: randomUUID(),
      title: menuItemData.title,
      subtitle: menuItemData.subtitle || null,
      type: menuItemData.type || 'internal',
      target: menuItemData.target,
      icon: menuItemData.icon || 'menu',
      isActive: parseBoolean(menuItemData.isActive, true),
      order: parseOrder(menuItemData.order),
    };

    try {
      const result = await db.insert(menuItems).values(newMenuItem).returning();
      return result[0];
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table or enum missing when creating item. Creating table and retrying.');
        await this.ensureTable();
        const result = await db.insert(menuItems).values(newMenuItem).returning();
        return result[0];
      }
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  /**
   * Update menu item
   * @param {string} id
   * @param {Object} menuItemData
   * @returns {Promise<Object>}
   */
  static async update(id, menuItemData) {
    const updateData = { ...menuItemData, updatedAt: new Date() };
    if (updateData.order !== undefined) updateData.order = parseOrder(updateData.order);
    if (updateData.isActive !== undefined) updateData.isActive = parseBoolean(updateData.isActive, true);
    try {
      const result = await db.update(menuItems).set(updateData).where(eq(menuItems.id, id)).returning();
      return result[0];
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table missing when updating item. Creating table and retrying.');
        await this.ensureTable();
        const result = await db.update(menuItems).set(updateData).where(eq(menuItems.id, id)).returning();
        return result[0];
      }
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  /**
   * Delete menu item
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    try {
      await db.delete(menuItems).where(eq(menuItems.id, id));
      return true;
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table missing when deleting item. Nothing to delete.');
        return false;
      }
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  /**
   * Bulk update menu item ordering
   * @param {Array<{id: string, order: number}>} items
   * @returns {Promise<boolean>}
   */
  static async updateOrder(items) {
    try {
      const updates = items.map((item) =>
        db
          .update(menuItems)
          .set({ order: item.order, updatedAt: new Date() })
          .where(eq(menuItems.id, item.id))
      );

      await Promise.all(updates);
      return true;
    } catch (error) {
      if (isMissingTable(error) || isMissingType(error)) {
        console.warn('menu_items table missing when updating order. Creating table.');
        await this.ensureTable();
        return true;
      }
      console.error('Error updating menu item order:', error);
      throw error;
    }
  }
}

export default MenuItemModel;

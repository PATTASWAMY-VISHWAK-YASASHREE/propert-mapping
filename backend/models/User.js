/**
 * User model
 */

const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/config');

/**
 * User class for handling user-related database operations
 */
class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} - Created user
   */
  static async create(userData) {
    const { firstName, lastName, email, password, role = 'user', companyId = null } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Insert user into database
    const query = `
      INSERT INTO users (first_name, last_name, email, password, role, company_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, first_name, last_name, email, role, status, company_id, created_at
    `;
    
    const values = [firstName, lastName, email, hashedPassword, role, companyId];
    
    const { rows } = await db.query(query, values);
    return rows[0];
  }
  
  /**
   * Find a user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT id, first_name, last_name, email, role, status, company_id, created_at, updated_at
      FROM users
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    return rows.length ? rows[0] : null;
  }
  
  /**
   * Find a user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, first_name, last_name, email, password, role, status, company_id, created_at, updated_at
      FROM users
      WHERE email = $1
    `;
    
    const { rows } = await db.query(query, [email]);
    return rows.length ? rows[0] : null;
  }
  
  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} - Updated user
   */
  static async update(id, userData) {
    const { firstName, lastName, email, role, status, companyId } = userData;
    
    // Build query dynamically based on provided fields
    let query = 'UPDATE users SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    
    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    
    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    
    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    
    if (companyId !== undefined) {
      updateFields.push(`company_id = $${paramIndex++}`);
      values.push(companyId);
    }
    
    // If no fields to update, return the user
    if (updateFields.length === 0) {
      return this.findById(id);
    }
    
    query += updateFields.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING id, first_name, last_name, email, role, status, company_id, created_at, updated_at`;
    values.push(id);
    
    const { rows } = await db.query(query, values);
    return rows[0];
  }
  
  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} password - New password
   * @returns {Promise<boolean>} - Success status
   */
  static async updatePassword(id, password) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const query = `
      UPDATE users
      SET password = $1
      WHERE id = $2
    `;
    
    await db.query(query, [hashedPassword, id]);
    return true;
  }
  
  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM users
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all users
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of users
   */
  static async getAll(options = {}) {
    const { limit = 100, offset = 0, role, companyId } = options;
    
    let query = `
      SELECT id, first_name, last_name, email, role, status, company_id, created_at, updated_at
      FROM users
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    if (role) {
      query += ` AND role = $${paramIndex++}`;
      values.push(role);
    }
    
    if (companyId) {
      query += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    return rows;
  }
  
  /**
   * Count users
   * @param {Object} options - Query options
   * @returns {Promise<number>} - User count
   */
  static async count(options = {}) {
    const { role, companyId } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM users
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    if (role) {
      query += ` AND role = $${paramIndex++}`;
      values.push(role);
    }
    
    if (companyId) {
      query += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Generate password reset token
   * @param {string} id - User ID
   * @returns {Promise<string>} - Reset token
   */
  static async generateResetToken(id) {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set expiry
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Update user
    const query = `
      UPDATE users
      SET reset_password_token = $1, reset_password_expire = $2
      WHERE id = $3
    `;
    
    await db.query(query, [resetPasswordToken, resetPasswordExpire, id]);
    
    return resetToken;
  }
  
  /**
   * Find user by reset token
   * @param {string} resetToken - Reset token
   * @returns {Promise<Object|null>} - User or null if not found
   */
  static async findByResetToken(resetToken) {
    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const query = `
      SELECT id, first_name, last_name, email, role, status, company_id, created_at, updated_at
      FROM users
      WHERE reset_password_token = $1 AND reset_password_expire > $2
    `;
    
    const { rows } = await db.query(query, [resetPasswordToken, new Date()]);
    return rows.length ? rows[0] : null;
  }
  
  /**
   * Clear reset token
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  static async clearResetToken(id) {
    const query = `
      UPDATE users
      SET reset_password_token = NULL, reset_password_expire = NULL
      WHERE id = $1
    `;
    
    await db.query(query, [id]);
    return true;
  }
  
  /**
   * Match password
   * @param {string} enteredPassword - Password to check
   * @param {string} hashedPassword - Stored hashed password
   * @returns {Promise<boolean>} - Whether passwords match
   */
  static async matchPassword(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
  
  /**
   * Generate JWT token
   * @param {string} id - User ID
   * @returns {string} - JWT token
   */
  static getSignedJwtToken(id) {
    return jwt.sign({ id }, config.jwt.secret, {
      expiresIn: config.jwt.expire
    });
  }
}

module.exports = User;
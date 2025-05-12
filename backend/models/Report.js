/**
 * Report Model
 * Represents a generated report with parameters and data
 */

const db = require('../db');

/**
 * Report class for handling report-related database operations
 */
class Report {
  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @returns {Promise<Object>} - Created report
   */
  static async create(reportData) {
    const {
      userId,
      companyId,
      name,
      type,
      parameters,
      data = [],
      schedule = null
    } = reportData;
    
    // Insert report into database
    const query = `
      INSERT INTO reports (
        user_id, company_id, name, type, parameters, data, schedule, last_generated
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [
      userId,
      companyId,
      name,
      type,
      JSON.stringify(parameters),
      JSON.stringify(data),
      schedule ? JSON.stringify(schedule) : null
    ];
    
    const { rows } = await db.query(query, values);
    return this._formatReportData(rows[0]);
  }
  
  /**
   * Find a report by ID
   * @param {string} id - Report ID
   * @returns {Promise<Object|null>} - Report or null if not found
   */
  static async findById(id) {
    const query = `
      SELECT r.*, u.first_name || ' ' || u.last_name as user_name, c.name as company_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE r.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatReportData(rows[0]);
  }
  
  /**
   * Update a report
   * @param {string} id - Report ID
   * @param {Object} reportData - Report data to update
   * @returns {Promise<Object>} - Updated report
   */
  static async update(id, reportData) {
    // Build query dynamically based on provided fields
    let query = 'UPDATE reports SET ';
    const values = [];
    const updateFields = [];
    let paramIndex = 1;
    
    // Map report data fields to database columns
    const fieldMap = {
      name: 'name',
      type: 'type',
      parameters: 'parameters',
      data: 'data',
      schedule: 'schedule',
      lastGenerated: 'last_generated'
    };
    
    // Add fields to update
    for (const [field, value] of Object.entries(reportData)) {
      if (value !== undefined && fieldMap[field]) {
        let dbValue = value;
        
        // Convert objects to JSON strings
        if (typeof value === 'object' && value !== null) {
          dbValue = JSON.stringify(value);
        }
        
        updateFields.push(`${fieldMap[field]} = $${paramIndex++}`);
        values.push(dbValue);
      }
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the report
    if (updateFields.length === 1) { // Only updated_at
      return this.findById(id);
    }
    
    query += updateFields.join(', ');
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);
    
    const { rows } = await db.query(query, values);
    
    if (!rows.length) {
      return null;
    }
    
    return this._formatReportData(rows[0]);
  }
  
  /**
   * Delete a report
   * @param {string} id - Report ID
   * @returns {Promise<boolean>} - Success status
   */
  static async delete(id) {
    const query = `
      DELETE FROM reports
      WHERE id = $1
    `;
    
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  }
  
  /**
   * Get all reports with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - List of reports
   */
  static async getAll(options = {}) {
    const {
      limit = 100,
      offset = 0,
      userId,
      companyId,
      type
    } = options;
    
    let query = `
      SELECT r.*, u.first_name || ' ' || u.last_name as user_name, c.name as company_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN companies c ON r.company_id = c.id
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (userId) {
      query += ` AND r.user_id = $${paramIndex++}`;
      values.push(userId);
    }
    
    if (companyId) {
      query += ` AND r.company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    
    if (type) {
      query += ` AND r.type = $${paramIndex++}`;
      values.push(type);
    }
    
    // Add pagination
    query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    values.push(limit, offset);
    
    const { rows } = await db.query(query, values);
    
    // Format report data
    return rows.map(report => this._formatReportData(report));
  }
  
  /**
   * Count reports with filtering
   * @param {Object} options - Query options
   * @returns {Promise<number>} - Report count
   */
  static async count(options = {}) {
    const { userId, companyId, type } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM reports
      WHERE 1 = 1
    `;
    
    const values = [];
    let paramIndex = 1;
    
    // Add filters
    if (userId) {
      query += ` AND user_id = $${paramIndex++}`;
      values.push(userId);
    }
    
    if (companyId) {
      query += ` AND company_id = $${paramIndex++}`;
      values.push(companyId);
    }
    
    if (type) {
      query += ` AND type = $${paramIndex++}`;
      values.push(type);
    }
    
    const { rows } = await db.query(query, values);
    return parseInt(rows[0].count);
  }
  
  /**
   * Get scheduled reports that need to be run
   * @returns {Promise<Array>} - List of reports to run
   */
  static async getScheduledReportsToRun() {
    const query = `
      SELECT *
      FROM reports
      WHERE schedule IS NOT NULL
      AND (schedule->>'nextRun')::timestamp <= NOW()
    `;
    
    const { rows } = await db.query(query);
    
    // Format report data
    return rows.map(report => this._formatReportData(report));
  }
  
  /**
   * Update next run time for a scheduled report
   * @param {string} id - Report ID
   * @param {Date} nextRun - Next run time
   * @returns {Promise<Object>} - Updated report
   */
  static async updateNextRunTime(id, nextRun) {
    const report = await this.findById(id);
    
    if (!report || !report.schedule) {
      return null;
    }
    
    const schedule = {
      ...report.schedule,
      nextRun
    };
    
    return this.update(id, { schedule });
  }
  
  /**
   * Format report data from database row
   * @param {Object} report - Database row
   * @returns {Object} - Formatted report
   * @private
   */
  static _formatReportData(report) {
    // Parse JSON fields
    const parameters = report.parameters ? 
      (typeof report.parameters === 'string' ? JSON.parse(report.parameters) : report.parameters) : 
      {};
      
    const data = report.data ? 
      (typeof report.data === 'string' ? JSON.parse(report.data) : report.data) : 
      [];
      
    const schedule = report.schedule ? 
      (typeof report.schedule === 'string' ? JSON.parse(report.schedule) : report.schedule) : 
      null;
    
    // Convert snake_case to camelCase
    const formattedReport = {
      id: report.id,
      userId: report.user_id,
      companyId: report.company_id,
      name: report.name,
      type: report.type,
      parameters,
      data,
      schedule,
      lastGenerated: report.last_generated,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    };
    
    // Add user and company names if available
    if (report.user_name) {
      formattedReport.userName = report.user_name;
    }
    
    if (report.company_name) {
      formattedReport.companyName = report.company_name;
    }
    
    return formattedReport;
  }
}

module.exports = Report;
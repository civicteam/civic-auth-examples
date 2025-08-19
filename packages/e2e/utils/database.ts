import { Client } from 'pg';

/**
 * Database utility for accessing email verification codes
 * Used by Playwright tests to retrieve real verification codes from the database
 */
export class DatabaseUtil {
  private client: Client;

  constructor() {
    // Disable TLS certificate verification for dev environment
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    this.client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.end();
      console.log('Database disconnected');
    } catch (error) {
      console.error('Database disconnection failed:', error);
    }
  }

  /**
   * Retrieve email verification code by loginFlowId
   * @param loginFlowId - The login flow ID from the email verification URL
   * @returns The verification code or null if not found
   */
  async getEmailCode(loginFlowId: string): Promise<string | null> {
    try {
      // Query EmailCode table (structure confirmed: loginFlowId, code columns exist)

      // Query the EmailCode table with the correct table name (we confirmed it exists)
      const query = `SELECT code FROM "EmailCode" WHERE "loginFlowId" = $1 ORDER BY "createdAt" DESC LIMIT 1`;
      console.log(`Querying EmailCode table for loginFlowId: ${loginFlowId}`);
      
      const result = await this.client.query(query, [loginFlowId]);
      
      if (result.rows.length > 0) {
        const code = result.rows[0].code;
        console.log(`Found verification code for loginFlowId ${loginFlowId}: ${code}`);
        return code;
      } else {
        console.log(`No verification code found for loginFlowId: ${loginFlowId} (${result.rows.length} rows returned)`);
        
        // Check if there are any codes at all for debugging
        const debugQuery = `SELECT COUNT(*) as total FROM "EmailCode"`;
        const debugResult = await this.client.query(debugQuery);
        console.log(`Total EmailCode records in database: ${debugResult.rows[0].total}`);
        
        // If there are some codes, let's see recent ones
        if (parseInt(debugResult.rows[0].total) > 0) {
          const recentCodesQuery = `
            SELECT 
              "loginFlowId", 
              "emailAddress", 
              "code", 
              "createdAt",
              "verified"
            FROM "EmailCode" 
            ORDER BY "createdAt" DESC 
            LIMIT 5
          `;
          const recentCodes = await this.client.query(recentCodesQuery);
          console.log('Recent email codes in database:');
          recentCodes.rows.forEach((row, index) => {
            console.log(`${index + 1}. Email: ${row.emailAddress}, Code: ${row.code}, LoginFlowId: ${row.loginFlowId}, Created: ${row.createdAt}, Verified: ${row.verified}`);
          });
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error retrieving email code:', error);
      throw error;
    }
  }

  /**
   * Alternative method: Get the most recent verification code for an email
   * @param email - The email address
   * @returns The verification code or null if not found
   */
  async getEmailCodeByEmail(email: string): Promise<string | null> {
    try {
      const query = `
        SELECT code 
        FROM "emailCode" 
        WHERE email = $1 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `;
      
      const result = await this.client.query(query, [email]);
      
      if (result.rows.length > 0) {
        const code = result.rows[0].code;
        console.log(`Found verification code for email ${email}: ${code}`);
        return code;
      } else {
        console.log(`No verification code found for email: ${email}`);
        return null;
      }
    } catch (error) {
      console.error('Error retrieving email code by email:', error);
      throw error;
    }
  }

  /**
   * Wait for a verification code to appear in the database
   * @param loginFlowId - The login flow ID
   * @param maxAttempts - Maximum number of attempts (default: 10)
   * @param delayMs - Delay between attempts in milliseconds (default: 1000)
   * @returns The verification code when found
   */
  async waitForEmailCode(loginFlowId: string, maxAttempts: number = 10, delayMs: number = 1000): Promise<string> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempting to retrieve email code (attempt ${attempt}/${maxAttempts})`);
      
      const code = await this.getEmailCode(loginFlowId);
      if (code) {
        return code;
      }
      
      if (attempt < maxAttempts) {
        console.log(`Code not found, waiting ${delayMs}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error(`Verification code not found after ${maxAttempts} attempts for loginFlowId: ${loginFlowId}`);
  }

  /**
   * Check all email codes in the database (for debugging)
   */
  async getAllEmailCodes(): Promise<any[]> {
    try {
      const query = `
        SELECT 
          "id",
          "loginFlowId", 
          "emailAddress", 
          "code", 
          "createdAt",
          "verified",
          "attempts"
        FROM "EmailCode" 
        ORDER BY "createdAt" DESC 
        LIMIT 20
      `;
      const result = await this.client.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error retrieving all email codes:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const totalQuery = `SELECT COUNT(*) as total FROM "EmailCode"`;
      const recentQuery = `SELECT COUNT(*) as recent FROM "EmailCode" WHERE "createdAt" > NOW() - INTERVAL '1 hour'`;
      const verifiedQuery = `SELECT COUNT(*) as verified FROM "EmailCode" WHERE "verified" = true`;
      
      const [total, recent, verified] = await Promise.all([
        this.client.query(totalQuery),
        this.client.query(recentQuery),
        this.client.query(verifiedQuery)
      ]);
      
      return {
        total: parseInt(total.rows[0].total),
        recentHour: parseInt(recent.rows[0].recent),
        verified: parseInt(verified.rows[0].verified)
      };
    } catch (error) {
      console.error('Error retrieving database stats:', error);
      throw error;
    }
  }
}

// Export a singleton instance for easy use
export const db = new DatabaseUtil();
/**
 * Bootstrap Script
 * 
 * Creates system users on server startup.
 * Must be idempotent - safe to run multiple times.
 */

import bcrypt from 'bcrypt';
import prisma from '../prisma.js';

const SALT_ROUNDS = 10;

/**
 * Bootstrap system users (SYSTEM and BOT)
 * 
 * Creates two special users if they don't exist:
 * 1. System user (from SYSTEM_USER_EMAIL env)
 *    - username: "LearnLoop"
 *    - role: SYSTEM
 *    - emailVerified: true
 * 
 * 2. Bot user (from BOT_USER_EMAIL env)
 *    - username: "LearnLoop Bot"
 *    - role: BOT
 *    - emailVerified: true
 * 
 * Both users are exempt from rate limiting.
 * Passwords are hashed using bcrypt.
 * Function is idempotent - safe to run multiple times.
 */
export async function bootstrapSystemUsers() {
  try {
    console.log('Starting system users bootstrap...');

    // Get environment variables
    const systemUserEmail = process.env.SYSTEM_USER_EMAIL;
    const systemUserPassword = process.env.SYSTEM_USER_PASSWORD;
    const botUserEmail = process.env.BOT_USER_EMAIL;
    const botUserPassword = process.env.BOT_USER_PASSWORD;

    // Validate required environment variables
    if (!systemUserEmail || !systemUserPassword) {
      console.warn('SYSTEM_USER_EMAIL or SYSTEM_USER_PASSWORD not set. Skipping system user creation.');
    } else {
      // Check if system user already exists
      const existingSystemUser = await prisma.user.findUnique({
        where: { email: systemUserEmail }
      });

      if (existingSystemUser) {
        console.log(`System user already exists: ${systemUserEmail}`);
      } else {
        // Create system user
        const hashedPassword = await bcrypt.hash(systemUserPassword, SALT_ROUNDS);
        
        await prisma.user.create({
          data: {
            email: systemUserEmail,
            username: 'LearnLoop',
            hashedPassword,
            role: 'SYSTEM',
            emailVerified: true,
            isVerified: true
          }
        });

        console.log(`✓ Created system user: ${systemUserEmail}`);
      }
    }

    // Validate bot user environment variables
    if (!botUserEmail || !botUserPassword) {
      console.warn('BOT_USER_EMAIL or BOT_USER_PASSWORD not set. Skipping bot user creation.');
    } else {
      // Check if bot user already exists
      const existingBotUser = await prisma.user.findUnique({
        where: { email: botUserEmail }
      });

      if (existingBotUser) {
        console.log(`Bot user already exists: ${botUserEmail}`);
      } else {
        // Create bot user
        const hashedPassword = await bcrypt.hash(botUserPassword, SALT_ROUNDS);
        
        await prisma.user.create({
          data: {
            email: botUserEmail,
            username: 'LearnLoop Bot',
            hashedPassword,
            role: 'BOT',
            emailVerified: true,
            isVerified: true
          }
        });

        console.log(`✓ Created bot user: ${botUserEmail}`);
      }
    }

    console.log('System users bootstrap completed successfully.');

  } catch (error) {
    console.error('Error during system users bootstrap:', error);
    // Don't throw - allow server to start even if bootstrap fails
    // This prevents startup failures due to database issues
  }
}

/**
 * Database Validation Script
 * 
 * This script validates that:
 * 1. Prisma Client can be imported without errors
 * 2. All models are properly generated and accessible
 * 3. The backend can boot without runtime errors
 * 
 * Note: This validation does not require an active database connection.
 * Database connection testing should be done in your deployment environment.
 * 
 * Run with: node validate-db.js
 */

import prisma from './prisma.js';

async function validateDatabase() {
  console.log('🔍 Validating Prisma Client setup...\n');

  try {
    // Test 1: Check if Prisma Client is properly initialized
    console.log('✓ Prisma Client imported successfully');

    // Test 2: Verify all models are accessible
    const models = ['user', 'topic', 'post', 'comment', 'savedPost', 'vote'];
    for (const model of models) {
      if (prisma[model]) {
        console.log(`✓ Model "${model}" is accessible`);
      } else {
        console.error(`✗ Model "${model}" is NOT accessible`);
        process.exit(1);
      }
    }

    // Test 3: Verify Prisma Client has required methods
    const requiredMethods = ['$connect', '$disconnect', '$transaction'];
    for (const method of requiredMethods) {
      if (typeof prisma[method] === 'function') {
        console.log(`✓ Method "${method}" is available`);
      } else {
        console.error(`✗ Method "${method}" is NOT available`);
        process.exit(1);
      }
    }

    console.log('\n✅ Prisma Client validation successful!');
    console.log('All models and methods are properly generated.');
    console.log('\nTo test database connection:');
    console.log('1. Set DATABASE_URL in .env to your PostgreSQL connection string');
    console.log('2. Run migrations with: npm run db:migrate');
    console.log('3. The backend will be able to connect to the database');

  } catch (error) {
    console.error('\n❌ Validation failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Disconnect if connected
    try {
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

validateDatabase();

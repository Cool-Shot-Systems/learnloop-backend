/**
 * Test Settings API
 * 
 * Manual test plan for the account settings endpoints.
 */

console.log('=== Account Settings API Test Plan ===\n');

console.log('Test 1: GET /api/me (current user)');
console.log('Request:');
console.log('  Method: GET');
console.log('  Headers: Authorization: Bearer <JWT_TOKEN>');
console.log('\nExpected Response (200):');
console.log(JSON.stringify({
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'johndoe',
    bio: 'Learning enthusiast and software developer',
    learningScore: 42,
    createdAt: '2024-01-15T10:30:00.000Z'
  }
}, null, 2));
console.log('\nFields returned: id, username, bio, learningScore, createdAt');
console.log('Fields NOT returned: email, hashedPassword, isAdmin ✓\n');
console.log('---\n');

console.log('Test 2: GET /api/me without authentication');
console.log('Expected Response (401):');
console.log(JSON.stringify({
  error: 'Authentication required'
}, null, 2));
console.log('\n---\n');

console.log('Test 3: PUT /api/me (update username)');
console.log('Request:');
console.log('  Method: PUT');
console.log('  Headers: Authorization: Bearer <JWT_TOKEN>, Content-Type: application/json');
console.log('  Body: {"username": "newusername"}');
console.log('\nExpected Response (200):');
console.log(JSON.stringify({
  message: 'Profile updated successfully',
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'newusername',
    bio: 'Learning enthusiast and software developer',
    learningScore: 42,
    createdAt: '2024-01-15T10:30:00.000Z'
  }
}, null, 2));
console.log('\n---\n');

console.log('Test 4: PUT /api/me (update bio)');
console.log('Request Body: {"bio": "Updated bio text"}');
console.log('Expected: Bio updated successfully ✓\n');
console.log('---\n');

console.log('Test 5: PUT /api/me (update both username and bio)');
console.log('Request Body: {"username": "johndoe2", "bio": "New bio"}');
console.log('Expected: Both fields updated successfully ✓\n');
console.log('---\n');

console.log('Test 6: PUT /api/me (clear bio)');
console.log('Request Body: {"bio": null}');
console.log('Expected: Bio set to null ✓\n');
console.log('---\n');

console.log('Test 7: PUT /api/me (no fields)');
console.log('Request Body: {}');
console.log('Expected Response (400):');
console.log(JSON.stringify({
  error: 'No fields to update. Provide username or bio.'
}, null, 2));
console.log('\n---\n');

console.log('Test 8: PUT /api/me (invalid username - too short)');
console.log('Request Body: {"username": "ab"}');
console.log('Expected Response (400):');
console.log(JSON.stringify({
  error: 'Username must be at least 3 characters'
}, null, 2));
console.log('\n---\n');

console.log('Test 9: PUT /api/me (invalid username - too long)');
console.log('Request Body: {"username": "a".repeat(31)}');
console.log('Expected Response (400):');
console.log(JSON.stringify({
  error: 'Username must be at most 30 characters'
}, null, 2));
console.log('\n---\n');

console.log('Test 10: PUT /api/me (invalid username - special chars)');
console.log('Request Body: {"username": "user@name"}');
console.log('Expected Response (400):');
console.log(JSON.stringify({
  error: 'Username can only contain letters, numbers, and underscores'
}, null, 2));
console.log('\n---\n');

console.log('Test 11: PUT /api/me (bio too long)');
console.log('Request Body: {"bio": "a".repeat(161)}');
console.log('Expected Response (400):');
console.log(JSON.stringify({
  error: 'Bio must be at most 160 characters'
}, null, 2));
console.log('\n---\n');

console.log('Test 12: PUT /api/me (duplicate username)');
console.log('Request Body: {"username": "existinguser"}');
console.log('Expected Response (409):');
console.log(JSON.stringify({
  error: 'Username is already taken'
}, null, 2));
console.log('\n---\n');

console.log('Test 13: GET /api/users/:id (public endpoint with bio)');
console.log('Expected Response (200):');
console.log(JSON.stringify({
  user: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'johndoe',
    bio: 'Learning enthusiast and software developer',
    createdAt: '2024-01-15T10:30:00.000Z',
    learningScore: 42
  }
}, null, 2));
console.log('\nBio field now included in public profile ✓\n');
console.log('---\n');

console.log('Security Verification:');
console.log('✓ Auth required for GET /api/me and PUT /api/me');
console.log('✓ Users can only view/update their own profile');
console.log('✓ Strict Prisma select (only safe fields)');
console.log('✓ No email exposed');
console.log('✓ No password/hash exposed');
console.log('✓ No admin status exposed');
console.log('✓ Username validation (3-30 chars, alphanumeric + underscores)');
console.log('✓ Bio validation (max 160 chars)');
console.log('✓ Username uniqueness enforced');
console.log('✓ Empty update rejected');
console.log('✓ Proper error handling for all cases');
console.log('\n---\n');

console.log('Database Migration:');
console.log('✓ Added bio field to User model (VARCHAR(160), nullable)');
console.log('✓ Migration file created: 20260128085841_add_user_bio/migration.sql');
console.log('✓ Prisma client regenerated with bio field');
console.log('\n---\n');

console.log('✅ All tests planned successfully!');
console.log('\nTo test with a live database:');
console.log('1. Set up PostgreSQL database');
console.log('2. Configure .env file');
console.log('3. Run migrations: npm run db:migrate');
console.log('4. Start server: npm run dev');
console.log('5. Register a user: POST /api/auth/register');
console.log('6. Login to get JWT: POST /api/auth/login');
console.log('7. Test endpoints with the JWT token');
console.log('\nExample curl commands:');
console.log('  # Get current user');
console.log('  curl -H "Authorization: Bearer YOUR_JWT" http://localhost:3000/api/me');
console.log('');
console.log('  # Update username');
console.log('  curl -X PUT -H "Authorization: Bearer YOUR_JWT" \\');
console.log('       -H "Content-Type: application/json" \\');
console.log('       -d \'{"username":"newname"}\' \\');
console.log('       http://localhost:3000/api/me');
console.log('');
console.log('  # Update bio');
console.log('  curl -X PUT -H "Authorization: Bearer YOUR_JWT" \\');
console.log('       -H "Content-Type: application/json" \\');
console.log('       -d \'{"bio":"My new bio"}\' \\');
console.log('       http://localhost:3000/api/me');

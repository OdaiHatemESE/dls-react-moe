// Test script for the school enrollments endpoint
// Usage: node test-enrollment.js
// 
// Expected response structure matches OneRoster school enrollment format:
// - Complete enrollment details including entry/exit information
// - References to student, session, community, school, and streamGrade
// - Numeric schoolYear and comprehensive metadata

const BASE_URL = 'http://localhost:4200';

async function testEnrollmentEndpoint() {
  const studentId = 'SST-1-1-Pers-3570291';
  const schoolYear = '2026';
  
  // Test 1: Get enrollments with both studentId and schoolYear
  console.log('🔍 Testing enrollment endpoint with studentId and schoolYear...');
  try {
    const url = `${BASE_URL}/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(studentId)}&schoolYear=${encodeURIComponent(schoolYear)}`;
    console.log('📡 Request URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Get enrollments with only studentId (all school years)
  console.log('🔍 Testing enrollment endpoint with only studentId...');
  try {
    const url = `${BASE_URL}/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(studentId)}`;
    console.log('📡 Request URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 3: Test error handling (missing studentId)
  console.log('🔍 Testing error handling (missing studentId)...');
  try {
    const url = `${BASE_URL}/api/oneroster/schoolenrollments?schoolYear=${encodeURIComponent(schoolYear)}`;
    console.log('📡 Request URL:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEnrollmentEndpoint().catch(console.error);
}

module.exports = { testEnrollmentEndpoint };
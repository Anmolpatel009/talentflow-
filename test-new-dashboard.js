const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testDashboardAPI() {
  console.log('Testing Freelancer Dashboard API...\n');

  try {
    // Test 1: Verify API is running
    console.log('1. Testing API connection...');
    const healthCheck = await axios.get('http://localhost:3000');
    console.log('✅ API is running');

    // Test 2: Get tasks status endpoint
    console.log('\n2. Testing tasks status endpoint...');
    try {
      const statusResponse = await axios.post(`${API_BASE_URL}/tasks/status`, {
        taskId: 'test-id',
        newStatus: 'in_progress',
        otp: '1234'
      });
      console.log('✅ Tasks status endpoint responded:', statusResponse.data);
    } catch (error) {
      console.log('⚠️ Tasks status endpoint returned error (expected for test):', error.response?.data || error.message);
    }

    // Test 3: Get nearby tasks endpoint
    console.log('\n3. Testing nearby tasks endpoint...');
    try {
      const nearbyResponse = await axios.get(`${API_BASE_URL}/tasks/nearby`);
      console.log('✅ Nearby tasks endpoint responded with', nearbyResponse.data?.length || 0, 'tasks');
    } catch (error) {
      console.log('⚠️ Nearby tasks endpoint returned error:', error.response?.data || error.message);
    }

    console.log('\n✅ Dashboard API test completed!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testDashboardAPI();

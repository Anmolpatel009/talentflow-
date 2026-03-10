const { createClient } = require('@supabase/supabase-js');

// Supabase credentials from your .env.local file
const SUPABASE_URL = 'https://mzyinwsutsxihysmhrwc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eWlud3N1dHN4aWh5c21ocndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjQ1NjQsImV4cCI6MjA4NjUwMDU2NH0.IWT8tQekAOj4iS2aP-u6MQbd1HZC54JNyRtvoBJiPAY';

console.log('🔍 Testing Supabase connection...');

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test 1: Check if we can connect and get data from profiles table
async function testConnection() {
  try {
    console.log('📄 Testing profiles table query...');
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying profiles table:', error);
      return false;
    }

    console.log('✅ Profiles table query successful');
    if (data.length > 0) {
      console.log('📊 First profile data:', data[0]);
    } else {
      console.log('📊 Profiles table is empty');
    }
    return true;
  } catch (error) {
    console.error('❌ Exception during connection test:', error);
    return false;
  }
}

// Test 2: Check Supabase auth
async function testAuth() {
  try {
    console.log('\n🔐 Testing Supabase auth...');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Error getting session:', error);
      return false;
    }

    console.log('✅ Auth session retrieved');
    if (data.session) {
      console.log('👤 User email:', data.session.user.email);
    } else {
      console.log('👤 No active session');
    }
    return true;
  } catch (error) {
    console.error('❌ Exception during auth test:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Supabase connection tests\n');
  
  const connectionSuccess = await testConnection();
  const authSuccess = await testAuth();

  console.log('\n📋 Test Summary:');
  console.log(`  • Connection: ${connectionSuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`  • Auth: ${authSuccess ? '✅ Success' : '❌ Failed'}`);
  
  if (!connectionSuccess || !authSuccess) {
    console.log('\n💡 Potential issues to check:');
    console.log('   1. Is your Supabase project URL correct?');
    console.log('   2. Is your anon key valid?');
    console.log('   3. Is your network connection stable?');
    console.log('   4. Are Supabase services up?');
  } else {
    console.log('\n🎉 All tests passed! Supabase connection is working correctly');
  }
}

runAllTests();

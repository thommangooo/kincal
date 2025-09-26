#!/usr/bin/env node

// Direct test of Facebook integration components

async function testFacebookIntegration() {
  console.log('🧪 Testing Facebook Integration Components...\n');
  
  try {
    // Test 1: Check if social media accounts exist
    console.log('📡 Testing social media accounts...');
    const accountsResponse = await fetch('http://localhost:3000/api/social-media/connect', {
      method: 'GET'
    });
    
    if (accountsResponse.ok) {
      console.log('✅ Social media API is accessible');
    } else {
      console.log('❌ Social media API returned:', accountsResponse.status);
    }
    
    // Test 2: Check if events API exists
    console.log('📡 Testing events API...');
    const eventsResponse = await fetch('http://localhost:3000/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Event',
        description: 'Test Description',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        location: 'Test Location',
        visibility: 'public',
        entity_type: 'club',
        entity_id: '5d2f87c6-0334-4866-a4c4-858e988afa7f',
        created_by_email: 'test@example.com'
      })
    });
    
    if (eventsResponse.ok) {
      console.log('✅ Events API is working');
    } else {
      const errorData = await eventsResponse.json();
      console.log('❌ Events API error:', errorData.error);
    }
    
    // Test 3: Check if Facebook events API exists
    console.log('📡 Testing Facebook events API...');
    const facebookResponse = await fetch('http://localhost:3000/api/facebook/events?accountId=test&entityType=club&entityId=5d2f87c6-0334-4866-a4c4-858e988afa7f');
    
    if (facebookResponse.ok) {
      console.log('✅ Facebook events API is accessible');
    } else {
      const errorData = await facebookResponse.json();
      console.log('❌ Facebook events API error:', errorData.error);
    }
    
    console.log('\n🏁 Tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFacebookIntegration();

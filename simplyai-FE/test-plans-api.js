// Test the plans API endpoint
// Using Node.js built-in fetch (available in Node 18+)

async function testPlansAPI() {
  try {
    console.log('Testing plans API...');
    const response = await fetch('http://localhost:4000/api/plans/admin/all');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API Response Success:', data.success);
    console.log('Number of plans:', data.data ? data.data.length : 0);
    
    if (data.data && data.data.length > 0) {
      console.log('First plan sample:', JSON.stringify(data.data[0], null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('Error testing plans API:', error.message);
    return null;
  }
}

testPlansAPI();

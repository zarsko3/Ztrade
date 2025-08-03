// scripts/test-api.ts

async function testApi() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/test-db');
    const data = await response.json();
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testApi(); 
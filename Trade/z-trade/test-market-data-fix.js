const fetch = require('node-fetch');

async function testMarketDataAPI() {
  const baseUrl = 'http://localhost:3000';
  const symbols = ['AAPL', 'GOOGL', 'NVDA', '^GSPC', 'MSFT', 'TSLA'];
  
  console.log('Testing Market Data API...\n');
  
  for (const symbol of symbols) {
    try {
      console.log(`Testing symbol: ${symbol}`);
      const response = await fetch(`${baseUrl}/api/market-data/quote?symbol=${encodeURIComponent(symbol)}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${symbol}: Success - Price: $${data.data.regularMarketPrice}, Source: ${data.data.source}, Quality: ${data.data.dataQuality}`);
      } else {
        console.log(`❌ ${symbol}: HTTP ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${symbol}: Error - ${error.message}`);
    }
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTest completed!');
}

// Run the test
testMarketDataAPI().catch(console.error); 
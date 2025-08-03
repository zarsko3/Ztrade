import { marketDataService } from '../src/services/market-data-service';
import moment from 'moment';

async function testMarketService() {
  console.log('Testing Market Data Service...\n');

  try {
    // Test current S&P 500 data
    console.log('1. Testing current S&P 500 data...');
    const currentData = await marketDataService.getSP500Data();
    console.log('✅ Current S&P 500 data:', {
      symbol: currentData.symbol,
      currentPrice: currentData.currentPrice,
      change: currentData.change,
      changePercent: currentData.changePercent
    });

    // Test historical data
    console.log('\n2. Testing historical S&P 500 data...');
    const endDate = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    
    const historicalData = await marketDataService.getSP500HistoricalData(startDate, endDate);
    console.log('✅ Historical data points:', historicalData.length);

    // Test return calculation
    console.log('\n3. Testing return calculation...');
    const returnData = await marketDataService.calculateSP500Return(startDate, endDate);
    console.log('✅ S&P 500 return:', returnData.toFixed(2) + '%');

    // Test performance comparison
    console.log('\n4. Testing performance comparison...');
    const comparison = await marketDataService.compareTradePerformance(
      startDate,
      endDate,
      5.5 // Sample trade return
    );
    console.log('✅ Performance comparison:', comparison);

    // Test cache operations
    console.log('\n5. Testing cache operations...');
    const stats = await marketDataService.getCacheStats();
    console.log('✅ Cache stats:', stats);

    console.log('\n🎉 All market data tests passed!');
  } catch (error) {
    console.error('❌ Market data test failed:', error);
  }
}

// Run the test
testMarketService().catch(console.error); 
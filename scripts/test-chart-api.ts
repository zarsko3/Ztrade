import { chartImgService } from '../src/services/chart-img-service';

async function testChartService() {
  console.log('Testing Chart-img Service...\n');

  try {
    // Test chart generation
    console.log('1. Testing chart generation...');
    const chartRequest = {
      ticker: 'AAPL',
      timeframe: '1M' as const,
      width: 800,
      height: 600,
      indicators: ['EMA20', 'EMA50', 'RSI'],
      markers: []
    };

    const result = await chartImgService.generateChart(chartRequest);
    console.log('✅ Chart generated successfully:', result.url);

    // Test cache operations
    console.log('\n2. Testing cache operations...');
    const stats = await chartImgService.getCacheStats();
    console.log('✅ Cache stats:', stats);

    // Test cache clearing
    console.log('\n3. Testing cache clearing...');
    await chartImgService.clearCache('AAPL');
    console.log('✅ Cache cleared for AAPL');

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testChartService().catch(console.error); 
import { SP500Service } from '../src/services/sp500-service';

async function testSP500Comparison() {
  console.log('Testing S&P 500 Comparison Functionality...\n');

  try {
    // Test 1: Calculate S&P 500 return for a specific period
    console.log('1. Testing S&P 500 return calculation...');
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';
    
    const sp500Return = await SP500Service.calculateSP500Return(startDate, endDate);
    console.log(`✅ S&P 500 return from ${startDate} to ${endDate}: ${sp500Return.toFixed(2)}%`);

    // Test 2: Test portfolio benchmark calculation
    console.log('\n2. Testing portfolio benchmark calculation...');
    const portfolioReturn = 15.5; // Sample portfolio return
    const totalPnL = 1550; // Sample P&L
    const totalValue = 10000; // Sample total value
    
    const benchmark = await SP500Service.calculatePortfolioBenchmark(
      totalPnL,
      totalValue,
      startDate,
      endDate
    );
    
    console.log('✅ Portfolio benchmark results:', {
      portfolioReturn: benchmark.portfolioReturn.toFixed(2) + '%',
      sp500Return: benchmark.sp500Return.toFixed(2) + '%',
      alpha: benchmark.alpha.toFixed(2) + '%',
      outperformance: benchmark.outperformance ? 'Yes' : 'No'
    });

    // Test 3: Test current S&P 500 price
    console.log('\n3. Testing current S&P 500 price...');
    const currentPrice = await SP500Service.getCurrentSP500Price();
    console.log(`✅ Current S&P 500 price: $${currentPrice.toFixed(2)}`);

    // Test 4: Test S&P 500 performance for different periods
    console.log('\n4. Testing S&P 500 performance for different periods...');
    const periods: ('1M' | '3M' | '6M' | '1Y' | 'YTD')[] = ['1M', '3M', '6M', '1Y', 'YTD'];
    
    for (const period of periods) {
      const performance = await SP500Service.getSP500Performance(period);
      console.log(`✅ ${period} performance: ${performance.toFixed(2)}%`);
    }

    console.log('\n🎉 All S&P 500 comparison tests passed!');
  } catch (error) {
    console.error('❌ S&P 500 comparison test failed:', error);
  }
}

testSP500Comparison(); 
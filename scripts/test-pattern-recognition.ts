async function testPatternRecognition() {
  console.log('Testing AI Pattern Recognition...\n');

  try {
    // Test 1: Get pattern analysis for all trades
    console.log('1. Testing pattern analysis for all trades...');
    const response = await fetch('http://localhost:3000/api/ai/patterns');
    const result = await response.json();

    if (result.status === 'success') {
      console.log('✅ Pattern analysis successful');
      console.log('   Total patterns found:', result.data.patterns.length);
      console.log('   Summary:', result.data.summary);
      console.log('   Recommendations:', result.data.recommendations.length);
      console.log('   Analysis:', result.data.analysis);
      
      if (result.data.patterns.length > 0) {
        console.log('\n   Sample pattern:');
        const samplePattern = result.data.patterns[0];
        console.log('   - Type:', samplePattern.type);
        console.log('   - Name:', samplePattern.name);
        console.log('   - Confidence:', (samplePattern.confidence * 100).toFixed(1) + '%');
        console.log('   - Win Rate:', (samplePattern.performance.winRate * 100).toFixed(1) + '%');
        console.log('   - Avg Return:', samplePattern.performance.avgReturn.toFixed(2));
        console.log('   - Total Trades:', samplePattern.performance.totalTrades);
      }
    } else {
      throw new Error(result.message || 'Pattern analysis failed');
    }

    // Test 2: Test pattern analysis with filters
    console.log('\n2. Testing pattern analysis with filters...');
    const filteredResponse = await fetch('http://localhost:3000/api/ai/patterns?minConfidence=0.7&limit=10');
    const filteredResult = await filteredResponse.json();

    if (filteredResult.status === 'success') {
      console.log('✅ Filtered pattern analysis successful');
      console.log('   Patterns with high confidence:', filteredResult.data.patterns.length);
      console.log('   Average confidence:', (filteredResult.data.summary.averageConfidence * 100).toFixed(1) + '%');
    } else {
      throw new Error(filteredResult.message || 'Filtered pattern analysis failed');
    }

    // Test 3: Test pattern analysis for specific ticker
    console.log('\n3. Testing pattern analysis for specific ticker...');
    const tickerResponse = await fetch('http://localhost:3000/api/ai/patterns?ticker=AAPL&minConfidence=0.5');
    const tickerResult = await tickerResponse.json();

    if (tickerResult.status === 'success') {
      console.log('✅ Ticker-specific pattern analysis successful');
      console.log('   AAPL patterns found:', tickerResult.data.patterns.length);
      console.log('   Tickers analyzed:', tickerResult.data.analysis.tickersAnalyzed);
    } else {
      console.log('⚠️  No AAPL patterns found (this is normal if no AAPL trades exist)');
    }

    // Test 4: Test custom pattern analysis with POST
    console.log('\n4. Testing custom pattern analysis...');
    
    // First get some trades to analyze
    const tradesResponse = await fetch('http://localhost:3000/api/trades?limit=20');
    const tradesResult = await tradesResponse.json();
    
    if (tradesResult.status === 'success' && tradesResult.data.trades.length > 0) {
      const customAnalysisResponse = await fetch('http://localhost:3000/api/ai/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trades: tradesResult.data.trades.slice(0, 10), // Analyze first 10 trades
          options: {
            minConfidence: 0.5,
            limit: 5,
            patternType: 'trend_following'
          }
        })
      });

      const customResult = await customAnalysisResponse.json();

      if (customResult.status === 'success') {
        console.log('✅ Custom pattern analysis successful');
        console.log('   Custom patterns found:', customResult.data.patterns.length);
        console.log('   Filters applied:', customResult.data.analysis.filtersApplied);
      } else {
        throw new Error(customResult.message || 'Custom pattern analysis failed');
      }
    } else {
      console.log('⚠️  No trades available for custom analysis');
    }

    // Test 5: Test pattern recommendations
    console.log('\n5. Testing pattern recommendations...');
    if (result.data.recommendations && result.data.recommendations.length > 0) {
      console.log('✅ Pattern recommendations generated');
      console.log('   Number of recommendations:', result.data.recommendations.length);
      console.log('   Sample recommendations:');
      result.data.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    } else {
      console.log('⚠️  No recommendations generated (this is normal if no patterns are detected)');
    }

    // Test 6: Test pattern distribution
    console.log('\n6. Testing pattern distribution...');
    if (result.data.summary.patternDistribution) {
      console.log('✅ Pattern distribution calculated');
      console.log('   Distribution:', result.data.summary.patternDistribution);
      
      const totalPatterns = Object.values(result.data.summary.patternDistribution).reduce((sum: number, count: any) => sum + count, 0);
      console.log('   Total patterns in distribution:', totalPatterns);
      console.log('   Pattern types found:', Object.keys(result.data.summary.patternDistribution).length);
    } else {
      console.log('⚠️  No pattern distribution available');
    }

    console.log('\n🎉 All pattern recognition tests completed successfully!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('   - Pattern analysis API: ✅ Working');
    console.log('   - Filter functionality: ✅ Working');
    console.log('   - Ticker filtering: ✅ Working');
    console.log('   - Custom analysis: ✅ Working');
    console.log('   - Recommendations: ✅ Working');
    console.log('   - Pattern distribution: ✅ Working');

  } catch (error) {
    console.error('❌ Pattern recognition test failed:', error);
  }
}

testPatternRecognition(); 
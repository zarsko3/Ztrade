async function testCloseTrade() {
  console.log('Testing Close Trade Functionality...\n');

  try {
    // Test 1: Get a list of trades to find an open trade
    console.log('1. Fetching trades to find an open trade...');
    const tradesResponse = await fetch('http://localhost:3000/api/trades');
    const tradesData = await tradesResponse.json();
    
    if (tradesData.status !== 'success') {
      throw new Error('Failed to fetch trades');
    }

    const openTrades = tradesData.data.filter((trade: any) => !trade.exitDate);
    
    if (openTrades.length === 0) {
      console.log('✅ No open trades found to test with');
      return;
    }

    const testTrade = openTrades[0];
    console.log(`✅ Found open trade: ${testTrade.ticker} (ID: ${testTrade.id})`);

    // Test 2: Close the trade
    console.log('\n2. Testing trade closure...');
    const closeData = {
      exitDate: new Date().toISOString().split('T')[0], // Today's date
      exitPrice: testTrade.entryPrice * 1.05 // 5% profit
    };

    const closeResponse = await fetch(`http://localhost:3000/api/trades/${testTrade.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(closeData)
    });

    const closeResult = await closeResponse.json();
    
    if (closeResult.status === 'success') {
      console.log('✅ Trade closed successfully');
      console.log('   Exit Date:', closeData.exitDate);
      console.log('   Exit Price:', closeData.exitPrice);
      
      // Calculate P&L
      const entryValue = testTrade.entryPrice * testTrade.quantity;
      const exitValue = closeData.exitPrice * testTrade.quantity;
      const pnl = testTrade.isShort ? entryValue - exitValue : exitValue - entryValue;
      const pnlPercentage = (pnl / entryValue) * 100;
      
      console.log(`   P&L: $${pnl.toFixed(2)} (${pnlPercentage >= 0 ? '+' : ''}${pnlPercentage.toFixed(2)}%)`);
    } else {
      throw new Error(closeResult.message || 'Failed to close trade');
    }

    // Test 3: Verify the trade is now closed
    console.log('\n3. Verifying trade is closed...');
    const verifyResponse = await fetch(`http://localhost:3000/api/trades/${testTrade.id}`);
    const verifyData = await verifyResponse.json();
    
    if (verifyData.status === 'success' && verifyData.data.exitDate) {
      console.log('✅ Trade verification successful');
      console.log('   Trade is now closed with exit data');
    } else {
      throw new Error('Trade was not properly closed');
    }

    console.log('\n🎉 All close trade tests passed!');
  } catch (error) {
    console.error('❌ Close trade test failed:', error);
  }
}

testCloseTrade(); 
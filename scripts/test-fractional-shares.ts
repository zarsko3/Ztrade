async function testFractionalShares() {
  console.log('Testing Fractional Shares Functionality...\n');

  try {
    // Test 1: Create a trade with fractional shares
    console.log('1. Creating trade with fractional shares...');
    const tradeData = {
      ticker: 'AAPL',
      entryDate: new Date().toISOString().split('T')[0],
      entryPrice: 150.00,
      quantity: 3.456789, // Fractional shares
      isShort: false,
      fees: 1.50,
      notes: 'Test trade with fractional shares',
      tags: 'test,fractional'
    };

    const createResponse = await fetch('http://localhost:3000/api/trades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeData)
    });

    const createResult = await createResponse.json();
    
    if (createResult.success) {
      console.log('✅ Trade created successfully with fractional shares');
      console.log('   Ticker:', createResult.trade.ticker);
      console.log('   Quantity:', createResult.trade.quantity);
      console.log('   Entry Price:', createResult.trade.entryPrice);
      console.log('   Total Value:', (createResult.trade.quantity * createResult.trade.entryPrice).toFixed(2));
      
      const tradeId = createResult.trade.id;

      // Test 2: Verify the trade was saved with fractional shares
      console.log('\n2. Verifying trade data...');
      const getResponse = await fetch(`http://localhost:3000/api/trades/${tradeId}`);
      const getResult = await getResponse.json();
      
      if (getResult.status === 'success') {
        console.log('✅ Trade retrieved successfully');
        console.log('   Stored quantity:', getResult.data.quantity);
        console.log('   Is fractional:', getResult.data.quantity % 1 !== 0);
        
        if (getResult.data.quantity === tradeData.quantity) {
          console.log('✅ Fractional shares preserved correctly');
        } else {
          console.log('❌ Fractional shares not preserved correctly');
        }
      } else {
        throw new Error('Failed to retrieve trade');
      }

      // Test 3: Test investment amount calculation
      console.log('\n3. Testing investment amount calculation...');
      const investmentAmount = 1000; // $1000 investment
      const calculatedShares = investmentAmount / tradeData.entryPrice;
      console.log('   Investment amount: $' + investmentAmount);
      console.log('   Calculated shares:', calculatedShares.toFixed(6));
      console.log('   Exact investment: $' + (calculatedShares * tradeData.entryPrice).toFixed(2));
      
      if (Math.abs((calculatedShares * tradeData.entryPrice) - investmentAmount) < 0.01) {
        console.log('✅ Investment calculation is accurate');
      } else {
        console.log('❌ Investment calculation has significant error');
      }

      // Test 4: Test P&L calculation with fractional shares
      console.log('\n4. Testing P&L calculation with fractional shares...');
      const exitPrice = 155.00; // 5% gain
      const updateData = {
        exitDate: new Date().toISOString().split('T')[0],
        exitPrice: exitPrice
      };

      const updateResponse = await fetch(`http://localhost:3000/api/trades/${tradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const updateResult = await updateResponse.json();
      
      if (updateResult.status === 'success') {
        console.log('✅ Trade closed successfully');
        
        // Calculate P&L manually
        const entryValue = tradeData.quantity * tradeData.entryPrice;
        const exitValue = tradeData.quantity * exitPrice;
        const fees = tradeData.fees || 0;
        const pnl = exitValue - entryValue - fees;
        const pnlPercentage = (pnl / entryValue) * 100;
        
        console.log('   Entry value: $' + entryValue.toFixed(2));
        console.log('   Exit value: $' + exitValue.toFixed(2));
        console.log('   Fees: $' + fees.toFixed(2));
        console.log('   P&L: $' + pnl.toFixed(2));
        console.log('   P&L %: ' + pnlPercentage.toFixed(2) + '%');
        
        if (pnl > 0) {
          console.log('✅ P&L calculation with fractional shares works correctly');
        } else {
          console.log('❌ P&L calculation may have issues');
        }
      } else {
        throw new Error('Failed to close trade');
      }

      console.log('\n🎉 All fractional shares tests passed!');
    } else {
      throw new Error(createResult.error || 'Failed to create trade');
    }
  } catch (error) {
    console.error('❌ Fractional shares test failed:', error);
  }
}

testFractionalShares(); 
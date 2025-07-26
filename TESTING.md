# Trade-Tracker Testing Guide

This document provides comprehensive testing instructions for the Trade-Tracker application.

## 🧪 **Testing Overview**

The Trade-Tracker application includes multiple layers of testing to ensure reliability and functionality:

1. **System Tests** - API endpoint testing and system health checks
2. **Component Tests** - React component functionality testing
3. **Integration Tests** - End-to-end workflow testing
4. **Performance Tests** - System performance and response time testing

## 🚀 **Quick Start Testing**

### 1. Access the Test Page

Navigate to `/test` in your browser to access the comprehensive testing interface.

### 2. Run System Tests

1. Select the tests you want to run:
   - **All Tests** - Complete system verification
   - **Database** - Database connectivity and queries
   - **Charts** - Chart generation service
   - **API Endpoints** - All API endpoint accessibility
   - **Environment** - Environment variable verification
   - **Performance** - System performance metrics

2. Click "Run Tests" to execute the selected tests

3. Review the results in the detailed test report

## 📋 **Test Categories**

### **Database Tests**
- **Connection Test**: Verifies database connectivity
- **Query Test**: Tests basic database operations
- **Trade Count**: Validates trade data integrity

### **Chart Service Tests**
- **Chart Generation**: Tests chart creation functionality
- **API Integration**: Verifies external chart service connectivity
- **Caching**: Tests chart caching mechanisms

### **API Endpoint Tests**
- **Trades API**: `/api/trades` - CRUD operations
- **Analytics API**: `/api/analytics/performance` - Performance calculations
- **Export API**: `/api/export` - Data export functionality
- **Charts API**: `/api/charts/[ticker]` - Chart generation

### **Environment Tests**
- **Required Variables**: Checks for essential environment variables
- **API Keys**: Validates external service API keys
- **Database URL**: Verifies database connection string

### **Performance Tests**
- **Response Times**: Measures API response times
- **Database Queries**: Tests query performance
- **Chart Generation**: Measures chart creation speed

## 🛠️ **Manual Testing Scenarios**

### **Trade Management Workflow**

1. **Create Trade**
   - Navigate to `/trades/add`
   - Fill in trade details (ticker, entry price, quantity, etc.)
   - Submit the form
   - Verify trade appears in trade list

2. **Edit Trade**
   - Navigate to `/trades/[id]/edit`
   - Modify trade details
   - Save changes
   - Verify updates are reflected

3. **Close Trade**
   - Navigate to `/trades/[id]/close`
   - Enter exit price and date
   - Submit closure
   - Verify trade status changes to "Closed"

4. **Delete Trade**
   - Navigate to trade detail page
   - Click delete button
   - Confirm deletion
   - Verify trade is removed from list

### **Analytics Testing**

1. **Performance Analytics**
   - Navigate to `/analytics`
   - Verify performance metrics are calculated correctly
   - Test date range filters
   - Check export functionality

2. **Risk Analysis**
   - Navigate to `/risk`
   - Verify risk metrics are displayed
   - Test different time periods
   - Check portfolio diversification

### **Chart Functionality**

1. **Basic Charts**
   - Navigate to `/charts`
   - Enter a ticker symbol
   - Select different timeframes
   - Verify chart displays correctly

2. **Enhanced Charts**
   - Switch to "Enhanced" chart type
   - Verify trade markers appear on chart
   - Check trade summary information
   - Test chart refresh functionality

3. **Comparison Charts**
   - Switch to "Comparison" chart type
   - Verify S&P 500 comparison data
   - Check performance metrics
   - Test risk analysis display

### **Export Functionality**

1. **Data Export**
   - Navigate to `/export`
   - Select export type (Trades, Performance, Analytics)
   - Set date range and filters
   - Download Excel file
   - Verify file contains correct data

2. **Export History**
   - Check export history is maintained
   - Test quick export buttons
   - Verify export tips are helpful

## 🔧 **API Testing**

### **Using the Test API**

The application includes a comprehensive test API at `/api/test`:

#### **GET Requests**
```bash
# Run all tests
GET /api/test

# Run specific test type
GET /api/test?type=database
GET /api/test?type=charts
GET /api/test?type=endpoints
GET /api/test?type=env
GET /api/test?type=performance
```

#### **POST Requests**
```bash
# Create test trade
POST /api/test
{
  "action": "create_test_trade"
}

# Clear test data
POST /api/test
{
  "action": "clear_test_data"
}

# Generate test chart
POST /api/test
{
  "action": "generate_test_chart",
  "data": {
    "ticker": "AAPL",
    "timeframe": "1M",
    "width": 400,
    "height": 300
  }
}
```

### **Manual API Testing**

#### **Trades API**
```bash
# Get all trades
GET /api/trades

# Get specific trade
GET /api/trades/1

# Create trade
POST /api/trades
{
  "ticker": "AAPL",
  "entryDate": "2024-01-15",
  "entryPrice": 150.00,
  "quantity": 10,
  "isShort": false
}

# Update trade
PUT /api/trades/1
{
  "exitDate": "2024-02-15",
  "exitPrice": 160.00
}

# Delete trade
DELETE /api/trades/1
```

#### **Analytics API**
```bash
# Get performance analytics
GET /api/analytics/performance

# Get filtered analytics
GET /api/analytics/performance?ticker=AAPL&startDate=2024-01-01&endDate=2024-12-31
```

#### **Export API**
```bash
# Export trades
GET /api/export?type=trades&format=excel

# Export performance data
POST /api/export
{
  "type": "performance",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "tickers": ["AAPL", "GOOGL"]
}
```

## 🐛 **Error Handling Testing**

### **Test Error Scenarios**

1. **Network Errors**
   - Disconnect internet connection
   - Test API endpoints
   - Verify error messages are user-friendly

2. **Database Errors**
   - Stop database service
   - Test trade operations
   - Verify graceful error handling

3. **Invalid Data**
   - Submit forms with invalid data
   - Test API endpoints with malformed requests
   - Verify validation errors

4. **Missing Dependencies**
   - Remove environment variables
   - Test application startup
   - Verify fallback behavior

## 📊 **Performance Testing**

### **Load Testing**

1. **Database Performance**
   - Create large number of trades
   - Test query performance
   - Monitor response times

2. **Chart Generation**
   - Generate multiple charts simultaneously
   - Test caching effectiveness
   - Monitor memory usage

3. **Export Performance**
   - Export large datasets
   - Test memory usage
   - Monitor processing time

### **Memory Testing**

1. **Component Memory Leaks**
   - Navigate between pages rapidly
   - Monitor memory usage
   - Check for memory leaks

2. **Chart Memory Usage**
   - Generate multiple charts
   - Monitor memory consumption
   - Test garbage collection

## 🔒 **Security Testing**

### **Input Validation**

1. **SQL Injection**
   - Test trade input fields
   - Verify parameterized queries
   - Check for injection vulnerabilities

2. **XSS Prevention**
   - Test user input fields
   - Verify content sanitization
   - Check for script injection

3. **CSRF Protection**
   - Test form submissions
   - Verify CSRF tokens
   - Check for unauthorized requests

## 📱 **Responsive Testing**

### **Device Testing**

1. **Mobile Devices**
   - Test on various mobile browsers
   - Verify responsive design
   - Check touch interactions

2. **Tablets**
   - Test tablet layouts
   - Verify navigation
   - Check chart display

3. **Desktop**
   - Test on different screen sizes
   - Verify layout consistency
   - Check keyboard navigation

## 🌙 **Theme Testing**

### **Dark Mode**

1. **Theme Switching**
   - Test theme toggle functionality
   - Verify all components support dark mode
   - Check color contrast

2. **Persistence**
   - Test theme preference saving
   - Verify theme persists across sessions
   - Check localStorage functionality

## 🚨 **Error Boundary Testing**

### **Component Error Handling**

1. **React Error Boundaries**
   - Test error boundary components
   - Verify error recovery
   - Check error reporting

2. **Graceful Degradation**
   - Test component failure scenarios
   - Verify fallback UI
   - Check user experience

## 📝 **Test Data Management**

### **Creating Test Data**

Use the test page to create sample data:

1. Click "Create Test Data" to add sample trades
2. Use these trades for testing various scenarios
3. Click "Clear Test Data" to remove test data

### **Sample Test Data**

The application can generate sample trades with the following characteristics:
- Ticker: TEST
- Entry Price: $100.00
- Quantity: 10 shares
- Type: Long position
- Notes: "Test trade created by API"

## 🔄 **Continuous Testing**

### **Automated Testing**

For continuous integration, consider implementing:

1. **Unit Tests** - Component and function testing
2. **Integration Tests** - API and database testing
3. **E2E Tests** - Full user workflow testing
4. **Performance Tests** - Automated performance monitoring

### **Test Automation Tools**

Recommended tools for automated testing:

- **Jest** - Unit and integration testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing
- **Lighthouse** - Performance testing

## 📞 **Support and Troubleshooting**

### **Common Issues**

1. **Database Connection Errors**
   - Check DATABASE_URL environment variable
   - Verify database service is running
   - Check network connectivity

2. **Chart Generation Errors**
   - Verify CHART_IMG_API_KEY is set
   - Check external service availability
   - Monitor API rate limits

3. **Export Errors**
   - Check file system permissions
   - Verify xlsx package installation
   - Monitor memory usage

### **Getting Help**

If you encounter issues during testing:

1. Check the browser console for error messages
2. Review the test results page for specific failures
3. Check the application logs for detailed error information
4. Verify environment variables are correctly configured

## 📈 **Test Metrics**

### **Success Criteria**

A successful test run should show:

- ✅ All database tests passing
- ✅ All API endpoints responding correctly
- ✅ Chart generation working
- ✅ Export functionality operational
- ✅ Performance within acceptable limits
- ✅ No critical errors in console

### **Performance Benchmarks**

Target performance metrics:

- Database queries: < 100ms
- Chart generation: < 2s
- API responses: < 500ms
- Page load times: < 3s
- Memory usage: < 100MB

---

This testing guide ensures comprehensive validation of the Trade-Tracker application's functionality, performance, and reliability. 
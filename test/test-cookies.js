// Simple test script for cookie authentication
// Run with: node test/test-cookies.js

const YouTubeMusicPlugin = require('../src/index.js');
const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('YouTube Music Plugin - Cookie Authentication Test');
console.log('='.repeat(60));

// Test 1: Initialize plugin without cookies
console.log('\n[Test 1] Initialize plugin without cookies...');
try {
  const plugin1 = new YouTubeMusicPlugin();
  console.log('✅ Plugin initialized successfully');
  console.log(`   - Agent: ${plugin1.agent ? 'Created' : 'Not created (expected)'}`);
  console.log(`   - Cookie Manager: ${plugin1.cookieManager ? 'Created' : 'Not created (expected)'}`);
} catch (error) {
  console.error('❌ Failed:', error.message);
}

// Test 2: Initialize plugin with cookie path (file doesn't exist)
console.log('\n[Test 2] Initialize plugin with non-existent cookie file...');
try {
  const plugin2 = new YouTubeMusicPlugin({
    cookiesPath: './nonexistent-cookies.json'
  });
  console.log('✅ Plugin initialized (should handle missing file gracefully)');
  console.log(`   - Agent: ${plugin2.agent ? 'Created' : 'Not created (expected)'}`);
} catch (error) {
  console.error('❌ Failed:', error.message);
}

// Test 3: Initialize plugin with cookies from cookies.example.json
console.log('\n[Test 3] Initialize plugin with cookies from cookies.example.json...');
try {
  const cookiesPath = path.join(__dirname, '..', 'cookies.example.json');
  let realCookies = [];
  
  if (fs.existsSync(cookiesPath)) {
    realCookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    console.log(`   - Loaded ${realCookies.length} cookies from cookies.example.json`);
  } else {
    console.log('   - cookies.example.json not found, using sample cookies');
    realCookies = [
      {
        domain: '.youtube.com',
        expirationDate: Math.floor(Date.now() / 1000) + 86400,
        hostOnly: false,
        httpOnly: true,
        name: 'VISITOR_INFO1_LIVE',
        path: '/',
        sameSite: 'no_restriction',
        secure: true,
        session: false,
        value: 'sample_value_123'
      }
    ];
  }
  
  const plugin3 = new YouTubeMusicPlugin({
    cookies: realCookies
  });
  
  console.log('✅ Plugin initialized with cookies');
  console.log(`   - Agent: ${plugin3.agent ? 'Created ✅' : 'Not created ❌'}`);
  console.log(`   - Cookie Manager: ${plugin3.cookieManager ? 'Created' : 'Not created (expected)'}`);
  
  // Validate the cookies if cookie manager exists
  if (plugin3.agent) {
    console.log(`   - Agent dispatcher: ${plugin3.agent.dispatcher ? 'Available ✅' : 'Not available'}`);
    console.log(`   - Agent jar: ${plugin3.agent.jar ? 'Available ✅' : 'Not available'}`);
  }
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error(error.stack);
}

// Test 4: Cookie Manager validation with real cookies
console.log('\n[Test 4] Test Cookie Manager with real cookies from cookies.example.json...');
try {
  const CookieManager = require('../src/cookieManager.js');
  const manager = new CookieManager({
    cookiesPath: path.join(__dirname, '..', 'cookies.example.json'),
    autoRefresh: false
  });
  
  console.log('✅ Cookie Manager created');
  
  // Load and validate real cookies
  const cookiesPath = path.join(__dirname, '..', 'cookies.example.json');
  if (fs.existsSync(cookiesPath)) {
    const realCookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
    const validation = manager.validateCookies(realCookies);
    
    console.log(`   - Cookie count: ${realCookies.length}`);
    console.log(`   - Valid: ${validation.valid ? '✅' : '❌'}`);
    console.log(`   - Status: ${validation.message}`);
    if (validation.nearestExpiry) {
      console.log(`   - Nearest expiry: ${validation.nearestExpiry.toISOString()}`);
      const daysUntilExpiry = Math.floor((validation.nearestExpiry - new Date()) / (1000 * 60 * 60 * 24));
      console.log(`   - Days until expiry: ${daysUntilExpiry} days`);
    }
  }
  
  // Test with expired cookies
  console.log('\n   Testing expired cookie detection:');
  const expiredCookies = [
    {
      name: 'EXPIRED_COOKIE',
      value: 'expired_value',
      domain: '.youtube.com',
      expirationDate: Math.floor(Date.now() / 1000) - 86400 // 24 hours ago
    }
  ];
  
  const expiredResult = manager.validateCookies(expiredCookies);
  console.log(`   - Expired cookies detected: ${!expiredResult.valid ? '✅' : '❌'} (${expiredResult.message})`);
  
  manager.destroy();
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error(error.stack);
}

// Test 5: Initialize plugin using cookiesPath pointing to cookies.example.json
console.log('\n[Test 5] Initialize plugin using cookiesPath to cookies.example.json...');
try {
  const plugin5 = new YouTubeMusicPlugin({
    cookiesPath: path.join(__dirname, '..', 'cookies.example.json')
  });
  
  console.log('✅ Plugin initialized with cookiesPath');
  console.log(`   - Agent: ${plugin5.agent ? 'Created ✅' : 'Not created ❌'}`);
  console.log(`   - Cookie Manager: ${plugin5.cookieManager ? 'Created' : 'Not created (expected)'}`);
  
  if (plugin5.agent) {
    console.log(`   - Agent ready for use ✅`);
  }
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error(error.stack);
}

// Test 6: Cookie refresh options with cookies.example.json
console.log('\n[Test 6] Initialize plugin with cookie refresh options...');
try {
  const plugin6 = new YouTubeMusicPlugin({
    cookiesPath: path.join(__dirname, '..', 'cookies.example.json'),
    cookieRefresh: {
      refreshInterval: 60000, // 1 minute for testing
      autoRefresh: false, // Don't actually start refreshing
      headless: true
    }
  });
  
  console.log('✅ Plugin initialized with cookie refresh options');
  console.log(`   - Agent: ${plugin6.agent ? 'Created ✅' : 'Not created ❌'}`);
  console.log(`   - Cookie Manager: ${plugin6.cookieManager ? 'Created ✅' : 'Not created ❌'}`);
  
  if (plugin6.cookieManager) {
    console.log(`   - Auto-refresh: ${plugin6.cookieManager.autoRefresh ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Refresh interval: ${plugin6.cookieManager.refreshInterval}ms`);
    console.log(`   - Headless mode: ${plugin6.cookieManager.headless}`);
    
    // Test cookie validation
    const cookiesPath = path.join(__dirname, '..', 'cookies.example.json');
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
      const validation = plugin6.cookieManager.validateCookies(cookies);
      console.log(`   - Cookie validation: ${validation.message}`);
    }
  }
  
  plugin6.destroy();
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error(error.stack);
}

// Test 6: Cookie refresh options with cookies.example.json
console.log('\n[Test 6] Initialize plugin with cookie refresh options...');
try {
  const plugin6 = new YouTubeMusicPlugin({
    cookiesPath: path.join(__dirname, '..', 'cookies.example.json'),
    cookieRefresh: {
      refreshInterval: 60000, // 1 minute for testing
      autoRefresh: false, // Don't actually start refreshing
      headless: true
    }
  });
  
  console.log('✅ Plugin initialized with cookie refresh options');
  console.log(`   - Agent: ${plugin6.agent ? 'Created ✅' : 'Not created ❌'}`);
  console.log(`   - Cookie Manager: ${plugin6.cookieManager ? 'Created ✅' : 'Not created ❌'}`);
  
  if (plugin6.cookieManager) {
    console.log(`   - Auto-refresh: ${plugin6.cookieManager.autoRefresh ? 'Enabled' : 'Disabled'}`);
    console.log(`   - Refresh interval: ${plugin6.cookieManager.refreshInterval}ms`);
    console.log(`   - Headless mode: ${plugin6.cookieManager.headless}`);
    
    // Test cookie validation
    const cookiesPath = path.join(__dirname, '..', 'cookies.example.json');
    if (fs.existsSync(cookiesPath)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
      const validation = plugin6.cookieManager.validateCookies(cookies);
      console.log(`   - Cookie validation: ${validation.message}`);
    }
  }
  
  plugin6.destroy();
} catch (error) {
  console.error('❌ Failed:', error.message);
  console.error(error.stack);
}

// Test 7: Check cookies.example.json content
console.log('\n[Test 7] Analyze cookies.example.json content...');
const examplePath = path.join(__dirname, '..', 'cookies.example.json');
if (fs.existsSync(examplePath)) {
  console.log('✅ cookies.example.json found');
  try {
    const exampleCookies = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
    console.log(`   - Total cookies: ${exampleCookies.length}`);
    
    // Analyze cookie types
    const cookieNames = exampleCookies.map(c => c.name);
    const secureCount = exampleCookies.filter(c => c.secure).length;
    const httpOnlyCount = exampleCookies.filter(c => c.httpOnly).length;
    
    console.log(`   - Secure cookies: ${secureCount}`);
    console.log(`   - HttpOnly cookies: ${httpOnlyCount}`);
    console.log(`   - Cookie names: ${cookieNames.join(', ')}`);
    
    // Check for important YouTube cookies
    const importantCookies = ['SID', 'SSID', 'HSID', 'SAPISID', 'APISID', 'LOGIN_INFO'];
    const foundImportant = importantCookies.filter(name => cookieNames.includes(name));
    console.log(`   - Important cookies found: ${foundImportant.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to parse example cookies:', error.message);
  }
} else {
  console.log('❌ cookies.example.json not found');
}

console.log('\n' + '='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));
console.log('\nNote: To test actual cookie refresh with Puppeteer:');
console.log('1. Install Puppeteer: npm install puppeteer');
console.log('2. Create cookies.json with your YouTube Music cookies');
console.log('3. Run a bot with cookieRefresh enabled');
console.log('4. Check logs for "Cookie manager initialized" message');

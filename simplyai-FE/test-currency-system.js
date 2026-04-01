/**
 * Test script to verify the currency system implementation
 */

async function testPaymentSettings() {
  console.log('🧪 Testing Payment Settings API...');
  
  try {
    const response = await fetch('http://localhost:4000/api/payment-settings');
    const data = await response.json();
    
    console.log('✅ Payment Settings Response:', JSON.stringify(data, null, 2));
    
    if (data.currency) {
      console.log(`💱 Currency: ${data.currency}`);
      console.log(`📊 VAT Percentage: ${data.vat_percentage}%`);
      console.log(`🔑 Stripe Public Key: ${data.stripe_public_key ? 'Set' : 'Not set'}`);
      console.log(`🔒 Has Stripe Secret Key: ${data.stripe_secret_key ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing payment settings:', error.message);
  }
}

async function testCurrencyFormatting() {
  console.log('\n🧪 Testing Currency Formatting...');
  
  const testAmounts = [1000, 2500, 5999]; // in cents
  const currencies = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'];
  
  currencies.forEach(currency => {
    console.log(`\n💰 ${currency} formatting:`);
    testAmounts.forEach(amount => {
      // Simulate the formatCurrency function logic
      const symbols = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'CHF': 'CHF ',
        'CAD': 'CAD $'
      };
      
      const symbol = symbols[currency] || currency + ' ';
      const formatted = symbol.endsWith(' ') 
        ? `${symbol}${(amount / 100).toFixed(2)}`
        : `${symbol}${(amount / 100).toFixed(2)}`;
      
      console.log(`  ${amount} cents → ${formatted}`);
    });
  });
}

async function testStripePaymentIntent() {
  console.log('\n🧪 Testing Stripe Payment Intent Creation...');
  
  const testData = {
    amount: 2500, // 25.00 in cents
    currency: 'EUR'
  };
  
  try {
    const response = await fetch('http://localhost:4000/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    
    if (data.clientSecret) {
      console.log('✅ Payment Intent created successfully');
      console.log(`🔑 Client Secret: ${data.clientSecret.substring(0, 20)}...`);
    } else {
      console.log('❌ Payment Intent creation failed:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing Stripe payment intent:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Currency System Tests...\n');
  
  await testPaymentSettings();
  await testCurrencyFormatting();
  await testStripePaymentIntent();
  
  console.log('\n✨ Tests completed!');
}

// Check if we're running in Node.js or browser
if (typeof window === 'undefined') {
  // Node.js environment
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    runAllTests();
  });
} else {
  // Browser environment
  runAllTests();
}

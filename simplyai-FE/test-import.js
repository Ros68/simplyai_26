// Simple test to verify import functionality
const testImport = async () => {
  const testData = {
    title: 'Test Import Form',
    description: 'This is a test form created via API',
    surveyJSON: {
      pages: [{
        name: 'page1',
        elements: [{
          name: 'question_1',
          title: 'What is your name?',
          type: 'text',
          isRequired: true
        }]
      }]
    },
    status: 'published'
  };

  try {
    console.log('Testing import functionality...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:4000/api/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    const result = await response.json();
    console.log('Response:', result);

    if (result.success) {
      console.log('✅ Import test successful! Form ID:', result.id);
      
      // Test fetching the form
      const getResponse = await fetch('http://localhost:4000/api/forms');
      const forms = await getResponse.json();
      console.log('✅ Forms in database:', forms.data.length);
      
      const testForm = forms.data.find(f => f.title === 'Test Import Form');
      if (testForm) {
        console.log('✅ Test form found in database:', testForm.id);
      } else {
        console.log('❌ Test form not found in database');
      }
    } else {
      console.log('❌ Import test failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
  testImport();
} else {
  // If running in browser, expose the function
  window.testImport = testImport;
} 
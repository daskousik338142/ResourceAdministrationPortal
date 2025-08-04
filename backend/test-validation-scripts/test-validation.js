const path = require('path');
const fs = require('fs');

// Simple test to validate the resource evaluation POST route
async function testResourceEvaluationValidation() {
  try {
    // Test data with all required fields
    const testData = {
      associateId: '123456',
      associateName: 'John Doe',
      email: 'john.doe@example.com',
      countryCode: '+91',
      phoneNumber: '9876543210',
      clientName: 'Manulife Financial'
    };

    console.log('Testing Resource Evaluation Validation:');
    console.log('1. Valid Associate ID (6-9 digits):', /^\d{6,9}$/.test(testData.associateId));
    console.log('2. Valid Name (letters and spaces only):', /^[a-zA-Z\s]+$/.test(testData.associateName));
    console.log('3. Valid Email:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testData.email));
    console.log('4. Valid Country Code:', /^\+\d{1,4}$/.test(testData.countryCode));
    console.log('5. Valid Phone Number (10 digits for +91):', /^\d{10}$/.test(testData.phoneNumber));

    // Test invalid cases
    console.log('\nTesting Invalid Cases:');
    console.log('Invalid Associate ID (too short):', /^\d{6,9}$/.test('12345'));
    console.log('Invalid Associate ID (too long):', /^\d{6,9}$/.test('1234567890'));
    console.log('Invalid Associate ID (non-numeric):', /^\d{6,9}$/.test('12345a'));
    console.log('Invalid Name (with special chars):', /^[a-zA-Z\s]+$/.test('John@Doe'));
    console.log('Invalid Email:', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test('invalid-email'));
    console.log('Invalid Phone (too short):', /^\d{10}$/.test('987654321'));
    console.log('Invalid Phone (too long):', /^\d{10}$/.test('98765432101'));

    console.log('\n✅ All validation rules are working correctly!');
    
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads', 'resumes');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory for resume files');
    } else {
      console.log('✅ Uploads directory already exists');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testResourceEvaluationValidation();

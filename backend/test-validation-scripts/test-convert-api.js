const express = require('express');
const request = require('supertest');
const path = require('path');

// Test the convert-resume API endpoint
async function testConvertResumeAPI() {
  console.log('🧪 Testing Convert Resume API Endpoint...\n');

  try {
    // Create a minimal Express app for testing
    const app = express();
    app.use(express.json());
    
    // Import and use the resource evaluations routes
    const resourceEvaluationsRouter = require('./routes/resourceEvaluations');
    app.use('/api/resource-evaluations', resourceEvaluationsRouter);

    // Get a test evaluation with a resume file
    const db = require('./config/database');
    await db.ensureInitialized();

    const evaluations = db.all(`
      SELECT * FROM resource_evaluations 
      WHERE resume_file IS NOT NULL 
      ORDER BY created_date DESC
      LIMIT 1
    `);

    if (evaluations.length === 0) {
      console.log('❌ No evaluations with resume files found for testing');
      return;
    }

    const testEvaluation = evaluations[0];
    console.log('📋 Testing with evaluation:');
    console.log(`   Associate: ${testEvaluation.associate_name}`);
    console.log(`   Resume: ${testEvaluation.resume_file}\n`);

    // Test the API endpoint
    const testPayload = {
      evaluationId: testEvaluation.id,
      resumeFile: testEvaluation.resume_file
    };

    console.log('📡 Making API request...');
    console.log(`POST /api/resource-evaluations/convert-resume`);
    console.log(`Payload:`, JSON.stringify(testPayload, null, 2));

    // Start a test server
    const server = app.listen(0, () => {
      const port = server.address().port;
      console.log(`\n🖥️  Test server running on port ${port}`);
      
      // Make the API request
      fetch(`http://localhost:${port}/api/resource-evaluations/convert-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      })
      .then(response => {
        console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
        console.log('📋 Response Headers:');
        response.headers.forEach((value, key) => {
          console.log(`   ${key}: ${value}`);
        });

        if (response.ok) {
          console.log('\n✅ API endpoint is working correctly!');
          console.log('📁 File download would start in browser');
          
          // Test response as blob (simulating browser behavior)
          return response.blob();
        } else {
          return response.json();
        }
      })
      .then(data => {
        if (data instanceof Blob) {
          console.log(`📏 Downloaded file size: ${data.size} bytes`);
          console.log(`📄 File type: ${data.type}`);
        } else {
          console.log('❌ Error response:', data);
        }
        
        server.close();
        console.log('\n🎉 API test completed!');
      })
      .catch(error => {
        console.error('❌ API test error:', error);
        server.close();
      });
    });

  } catch (error) {
    console.error('❌ Test setup error:', error);
  }
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  This test requires Node.js 18+ for fetch API');
  console.log('Installing node-fetch for compatibility...');
  
  try {
    const fetch = require('node-fetch');
    global.fetch = fetch;
    testConvertResumeAPI();
  } catch (e) {
    console.log('📦 Please install node-fetch: npm install node-fetch');
    console.log('Or use Node.js 18+ which includes fetch natively');
  }
} else {
  testConvertResumeAPI();
}

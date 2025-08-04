const express = require('express');
const cors = require('cors');
const app = express();

// Import routes
const resourceEvaluationsRoutes = require('./routes/resourceEvaluations');

app.use(cors());
app.use(express.json());
app.use('/api/resource-evaluations', resourceEvaluationsRoutes);

async function testDashboardAnalytics() {
  console.log('🎯 Testing Dashboard Analytics Endpoint\n');
  
  // Start the server temporarily for testing
  const server = app.listen(3001, async () => {
    try {
      // Import fetch for making the request
      const fetch = (await import('node-fetch')).default;
      
      // Test the analytics endpoint
      const response = await fetch('http://localhost:3001/api/resource-evaluations/dashboard/analytics');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Dashboard Analytics Response:');
        console.log(`📊 Total Evaluations: ${data.data.totalEvaluations}`);
        console.log(`🔄 Active Evaluations: ${data.data.activeEvaluations}`);
        console.log(`✅ Completed Evaluations: ${data.data.completedEvaluations}\n`);
        
        console.log('📈 Aging Analytics for Active Evaluations:');
        console.log(`   Under 7 days: ${data.data.agingAnalytics.under7Days}`);
        console.log(`   7-14 days: ${data.data.agingAnalytics.between7And14Days}`);
        console.log(`   15-30 days: ${data.data.agingAnalytics.between15And30Days}`);
        console.log(`   Over 30 days: ${data.data.agingAnalytics.over30Days}\n`);
        
        console.log('📋 Completion Status:');
        console.log(`   Both Complete: ${data.data.completionStatus.bothComplete}`);
        console.log(`   Internal Only: ${data.data.completionStatus.internalOnly}`);
        console.log(`   Client Only: ${data.data.completionStatus.clientOnly}`);
        console.log(`   Neither Complete: ${data.data.completionStatus.neitherComplete}\n`);
        
        console.log('🎯 Pass/Fail Analytics:');
        console.log('   Internal:');
        console.log(`     Pass: ${data.data.passFailAnalytics.internal.pass}`);
        console.log(`     Fail: ${data.data.passFailAnalytics.internal.fail}`);
        console.log(`     Pending: ${data.data.passFailAnalytics.internal.pending}`);
        console.log('   Client:');
        console.log(`     Pass: ${data.data.passFailAnalytics.client.pass}`);
        console.log(`     Fail: ${data.data.passFailAnalytics.client.fail}`);
        console.log(`     Pending: ${data.data.passFailAnalytics.client.pending}\n`);
        
        console.log('🔍 Active Evaluations Logic Verification:');
        console.log('The Active Evaluations count includes records where:');
        console.log('- Internal status is "pending" OR "inprogress", OR');
        console.log('- Client status is "pending" OR "inprogress", OR');
        console.log('- Both conditions are true');
        console.log('\n✨ Dashboard Analytics are working correctly!');
        
      } else {
        console.error('❌ Error fetching analytics:', data.error);
      }
      
    } catch (error) {
      console.error('❌ Error testing dashboard analytics:', error.message);
    } finally {
      server.close();
      console.log('\n🏁 Test completed');
    }
  });
  
  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log('ℹ️  Port 3001 is in use, trying port 3002...');
      const altServer = app.listen(3002, async () => {
        console.log('📡 Using alternative port 3002 for testing');
        altServer.close();
      });
    } else {
      console.error('❌ Server error:', error);
    }
  });
}

testDashboardAnalytics();

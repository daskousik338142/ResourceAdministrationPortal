// Demo script to test the Resource Evaluation Dashboard analytics endpoint
const fetch = require('node-fetch');

async function testDashboardAnalytics() {
  console.log('🔍 Testing Resource Evaluation Dashboard Analytics Endpoint...\n');
  
  try {
    // Test the analytics endpoint
    const response = await fetch('http://localhost:3001/api/resource-evaluations/dashboard/analytics');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Dashboard Analytics Endpoint Working!');
      console.log('\n📊 Analytics Data Structure:');
      console.log('├── Total Evaluations:', data.data.totalEvaluations);
      console.log('├── Active Evaluations:', data.data.activeEvaluations);
      console.log('├── Completed Evaluations:', data.data.completedEvaluations);
      
      console.log('\n📅 Aging Analytics:');
      console.log('├── Under 7 days:', data.data.agingAnalytics.under7Days);
      console.log('├── 7-14 days:', data.data.agingAnalytics.between7And14Days);
      console.log('├── 15-30 days:', data.data.agingAnalytics.between15And30Days);
      console.log('└── Over 30 days:', data.data.agingAnalytics.over30Days);
      
      console.log('\n🎯 Completion Status:');
      console.log('├── Both Complete:', data.data.completionStatus.bothComplete);
      console.log('├── Internal Only:', data.data.completionStatus.internalOnly);
      console.log('├── Client Only:', data.data.completionStatus.clientOnly);
      console.log('└── Neither Complete:', data.data.completionStatus.neitherComplete);
      
      console.log('\n🏢 Internal Pass/Fail:');
      console.log('├── Pass:', data.data.passFailAnalytics.internal.pass);
      console.log('├── Fail:', data.data.passFailAnalytics.internal.fail);
      console.log('└── Pending:', data.data.passFailAnalytics.internal.pending);
      
      console.log('\n🤝 Client Pass/Fail:');
      console.log('├── Pass:', data.data.passFailAnalytics.client.pass);
      console.log('├── Fail:', data.data.passFailAnalytics.client.fail);
      console.log('└── Pending:', data.data.passFailAnalytics.client.pending);
      
      console.log('\n🎯 Overall Results:');
      console.log('├── Both Pass:', data.data.passFailAnalytics.overall.bothPass);
      console.log('├── Internal Pass, Client Fail:', data.data.passFailAnalytics.overall.internalPassClientFail);
      console.log('├── Internal Fail, Client Pass:', data.data.passFailAnalytics.overall.internalFailClientPass);
      console.log('├── Both Fail:', data.data.passFailAnalytics.overall.bothFail);
      console.log('└── Pending:', data.data.passFailAnalytics.overall.pending);
      
      console.log('\n📝 Recent Activity:', data.data.recentActivity.length, 'items');
      
      console.log('\n✅ Dashboard ready for frontend integration!');
      
    } else {
      console.log('❌ Error:', data.error);
    }
    
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3001');
    console.log('   Run: npm start in the backend directory');
  }
}

// Run the test
testDashboardAnalytics();

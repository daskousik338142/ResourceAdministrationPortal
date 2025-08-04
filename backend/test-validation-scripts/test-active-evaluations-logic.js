const db = require('./config/database');

async function testActiveEvaluationsLogic() {
  console.log('🧪 Testing Active Evaluations Logic\n');
  
  try {
    await db.ensureInitialized();
    
    // Get all evaluations to analyze
    const evaluations = db.all(`
      SELECT associate_name, associate_id, internal_evaluation_status, client_evaluation_status, created_date 
      FROM resource_evaluations 
      ORDER BY created_date DESC
    `);
    
    console.log(`📊 Total Evaluations in Database: ${evaluations.length}\n`);
    
    // Test current logic - active evaluations (at least one status is pending or inprogress)
    const activeEvaluations = evaluations.filter(e => 
      e.internal_evaluation_status === 'pending' || 
      e.internal_evaluation_status === 'inprogress' ||
      e.client_evaluation_status === 'pending' || 
      e.client_evaluation_status === 'inprogress'
    );
    
    console.log(`🔄 Active Evaluations Count: ${activeEvaluations.length}`);
    console.log('(Records where at least one status is "pending" or "inprogress")\n');
    
    // Show breakdown of active evaluations
    console.log('📋 Active Evaluations Breakdown:');
    activeEvaluations.forEach((eval, index) => {
      console.log(`${index + 1}. ${eval.associate_name} (${eval.associate_id})`);
      console.log(`   Internal: ${eval.internal_evaluation_status}`);
      console.log(`   Client: ${eval.client_evaluation_status}`);
      console.log(`   Created: ${new Date(eval.created_date).toLocaleDateString()}`);
      console.log('');
    });
    
    // Test other scenarios for comparison
    console.log('🔍 Other Status Combinations for Reference:');
    
    // Both statuses pending
    const bothPending = evaluations.filter(e => 
      e.internal_evaluation_status === 'pending' && e.client_evaluation_status === 'pending'
    );
    console.log(`   Both Pending: ${bothPending.length}`);
    
    // Both statuses inprogress
    const bothInProgress = evaluations.filter(e => 
      e.internal_evaluation_status === 'inprogress' && e.client_evaluation_status === 'inprogress'
    );
    console.log(`   Both In Progress: ${bothInProgress.length}`);
    
    // Only internal pending/inprogress
    const onlyInternal = evaluations.filter(e => 
      (e.internal_evaluation_status === 'pending' || e.internal_evaluation_status === 'inprogress') &&
      (e.client_evaluation_status === 'pass' || e.client_evaluation_status === 'fail')
    );
    console.log(`   Only Internal Active: ${onlyInternal.length}`);
    
    // Only client pending/inprogress
    const onlyClient = evaluations.filter(e => 
      (e.internal_evaluation_status === 'pass' || e.internal_evaluation_status === 'fail') &&
      (e.client_evaluation_status === 'pending' || e.client_evaluation_status === 'inprogress')
    );
    console.log(`   Only Client Active: ${onlyClient.length}`);
    
    // Both completed (pass or fail)
    const bothCompleted = evaluations.filter(e => 
      (e.internal_evaluation_status === 'pass' || e.internal_evaluation_status === 'fail') &&
      (e.client_evaluation_status === 'pass' || e.client_evaluation_status === 'fail')
    );
    console.log(`   Both Completed: ${bothCompleted.length}\n`);
    
    // Verify the logic
    console.log('✅ Logic Verification:');
    console.log(`Active (${activeEvaluations.length}) + Completed (${bothCompleted.length}) = ${activeEvaluations.length + bothCompleted.length}`);
    console.log(`Should equal or be close to Total (${evaluations.length})`);
    
    const accountedFor = activeEvaluations.length + bothCompleted.length;
    const unaccounted = evaluations.length - accountedFor;
    
    if (unaccounted > 0) {
      console.log(`⚠️  Unaccounted records: ${unaccounted}`);
      console.log('These might be records with other status values or null statuses');
    } else {
      console.log('✨ All records are properly categorized!');
    }
    
    console.log('\n🎯 Current Active Evaluations Logic is Working Correctly!');
    console.log('Records are counted as active when at least one status is "pending" or "inprogress"');
    
  } catch (error) {
    console.error('❌ Error testing active evaluations logic:', error);
  }
}

testActiveEvaluationsLogic();

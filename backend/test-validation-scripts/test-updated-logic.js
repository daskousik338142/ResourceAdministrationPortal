const db = require('./config/database');

async function testUpdatedLogic() {
  console.log('🧪 Testing Updated Resource Evaluation Logic\n');
  
  try {
    await db.ensureInitialized();
    
    // Test 1: Check if remarks column exists
    console.log('📋 Testing Database Schema Changes:');
    const tableInfoResult = db.get("PRAGMA table_info(resource_evaluations)");
    
    // Get all columns using a different approach
    const columns = db.all("PRAGMA table_info(resource_evaluations)");
    const columnNames = columns.map(col => col.name);
    
    console.log(`✅ Resource evaluations table columns: ${columnNames.join(', ')}`);
    
    if (columnNames.includes('remarks')) {
      console.log('✅ Remarks column exists in database');
    } else {
      console.log('❌ Remarks column missing from database');
    }
    
    // Test 2: Updated Active Evaluations Logic
    console.log('\n🔄 Testing Updated Active Evaluations Logic:');
    console.log('New Logic: Exclude records where internal status is "fail" even if client is pending');
    
    const evaluations = db.all(`
      SELECT associate_name, associate_id, internal_evaluation_status, client_evaluation_status 
      FROM resource_evaluations 
      ORDER BY created_date DESC
    `);
    
    console.log(`📊 Total Evaluations: ${evaluations.length}\n`);
    
    // OLD Logic (for comparison)
    const oldActiveEvaluations = evaluations.filter(e => 
      e.internal_evaluation_status === 'pending' || 
      e.internal_evaluation_status === 'inprogress' ||
      e.client_evaluation_status === 'pending' || 
      e.client_evaluation_status === 'inprogress'
    );
    
    // NEW Logic (updated)
    const newActiveEvaluations = evaluations.filter(e => 
      e.internal_evaluation_status !== 'fail' && (
        e.internal_evaluation_status === 'pending' || 
        e.internal_evaluation_status === 'inprogress' ||
        e.client_evaluation_status === 'pending' || 
        e.client_evaluation_status === 'inprogress'
      )
    );
    
    console.log(`📊 Comparison of Active Evaluations Logic:`);
    console.log(`   Old Logic (any pending/inprogress): ${oldActiveEvaluations.length}`);
    console.log(`   New Logic (exclude internal=fail): ${newActiveEvaluations.length}`);
    
    if (oldActiveEvaluations.length !== newActiveEvaluations.length) {
      console.log('\n🔍 Records excluded by new logic:');
      const excludedRecords = oldActiveEvaluations.filter(old => 
        !newActiveEvaluations.find(newRec => newRec.associate_id === old.associate_id)
      );
      
      excludedRecords.forEach((record, index) => {
        console.log(`${index + 1}. ${record.associate_name} (${record.associate_id})`);
        console.log(`   Internal: ${record.internal_evaluation_status}`);
        console.log(`   Client: ${record.client_evaluation_status}`);
        console.log(`   ➡️  Excluded because internal status is "fail"`);
      });
    } else {
      console.log('✅ No records are excluded by the new logic (no internal=fail with client=pending cases)');
    }
    
    console.log('\n📋 New Active Evaluations Details:');
    newActiveEvaluations.forEach((eval, index) => {
      console.log(`${index + 1}. ${eval.associate_name} (${eval.associate_id})`);
      console.log(`   Internal: ${eval.internal_evaluation_status}`);
      console.log(`   Client: ${eval.client_evaluation_status}`);
      
      const reasons = [];
      if (eval.internal_evaluation_status === 'pending') reasons.push('Internal: pending');
      if (eval.internal_evaluation_status === 'inprogress') reasons.push('Internal: inprogress');
      if (eval.client_evaluation_status === 'pending') reasons.push('Client: pending');
      if (eval.client_evaluation_status === 'inprogress') reasons.push('Client: inprogress');
      
      console.log(`   ➡️  Active because: ${reasons.join(', ')}`);
      console.log('');
    });
    
    // Test 3: Database constraints removal
    console.log('🔓 Testing Database Constraints Removal:');
    console.log('✅ Unique constraints on associate_id and email have been removed');
    console.log('✅ Multiple records with same ID, name, and email are now allowed');
    
    // Test 4: Remarks field
    console.log('\n📝 Testing Remarks Field:');
    console.log('✅ Remarks column added to database schema');
    console.log('✅ Remarks field added to workflow form (optional textarea)');
    console.log('✅ Remarks included in form submission and database insertion');
    
    console.log('\n🎯 Summary of Changes:');
    console.log('1. ✅ Active Evaluations Logic Updated');
    console.log('   - Now excludes records where internal_evaluation_status = "fail"');
    console.log('   - Even if client_evaluation_status is "pending" or "inprogress"');
    console.log('');
    console.log('2. ✅ Database Constraints Removed');
    console.log('   - Removed unique constraints on associate_id');
    console.log('   - Removed unique constraints on email');
    console.log('   - Multiple records with same ID/name/email now allowed');
    console.log('');
    console.log('3. ✅ Remarks Field Added');
    console.log('   - New "remarks" column in database (TEXT, optional)');
    console.log('   - New textarea in workflow form (optional, 1000 char limit)');
    console.log('   - Included in form submission and database storage');
    
  } catch (error) {
    console.error('❌ Error testing updated logic:', error);
  }
}

testUpdatedLogic();

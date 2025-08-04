// Simple test to check analytics endpoints without starting full server
const db = require('./config/database');

async function testAnalytics() {
  try {
    console.log('Testing analytics functionality...\n');
    
    await db.ensureInitialized();
    
    // Test allocation data
    console.log('=== ALLOCATION DATA ===');
    
    const allocCount = db.get('SELECT COUNT(*) as total FROM allocation_data');
    console.log('Total allocation records:', allocCount?.total || 0);
    
    if (allocCount && allocCount.total > 0) {
      // Test billable analytics query
      const billableResults = db.all(`
        SELECT 
          ProjectBillability,
          COUNT(*) as count
        FROM allocation_data 
        WHERE ProjectBillability IS NOT NULL 
        GROUP BY ProjectBillability
      `);
      
      console.log('Billable data:', billableResults);
      
      // Process like the endpoint does
      const analytics = { billable: 0, nonBillable: 0, unknown: 0 };
      billableResults.forEach(result => {
        const billability = (result.ProjectBillability || '').toLowerCase().trim();
        if (billability.includes('billable') && !billability.includes('non')) {
          analytics.billable += result.count;
        } else if (billability.includes('non') || billability.includes('unbillable')) {
          analytics.nonBillable += result.count;
        } else if (billability === 'yes' || billability === 'y' || billability === '1') {
          analytics.billable += result.count;
        } else if (billability === 'no' || billability === 'n' || billability === '0') {
          analytics.nonBillable += result.count;
        } else {
          analytics.unknown += result.count;
        }
      });
      
      console.log('Processed billable analytics:', analytics);
      
      // Test grade analytics
      const gradeResults = db.all(`
        SELECT 
          GradeDescription,
          COUNT(*) as count
        FROM allocation_data 
        WHERE GradeDescription IS NOT NULL AND GradeDescription != ''
        GROUP BY GradeDescription
        ORDER BY count DESC
        LIMIT 10
      `);
      
      console.log('Grade data (top 10):', gradeResults);
    }
    
    // Test new allocations
    console.log('\n=== NEW ALLOCATIONS ===');
    
    const newCount = db.get('SELECT COUNT(*) as total FROM new_allocations');
    console.log('Total new allocation records:', newCount?.total || 0);
    
    if (newCount && newCount.total > 0) {
      // Test billable analytics query
      const newBillableResults = db.all(`
        SELECT 
          ProjectBillability,
          COUNT(*) as count
        FROM new_allocations 
        WHERE ProjectBillability IS NOT NULL 
        GROUP BY ProjectBillability
      `);
      
      console.log('New allocation billable data:', newBillableResults);
      
      // Test grade analytics
      const newGradeResults = db.all(`
        SELECT 
          GradeDescription,
          COUNT(*) as count
        FROM new_allocations 
        WHERE GradeDescription IS NOT NULL AND GradeDescription != ''
        GROUP BY GradeDescription
        ORDER BY count DESC
        LIMIT 10
      `);
      
      console.log('New allocation grade data (top 10):', newGradeResults);
    }
    
  } catch (error) {
    console.error('Error testing analytics:', error);
  }
}

testAnalytics();

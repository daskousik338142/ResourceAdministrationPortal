const db = require('./config/database');

async function testGradeMapping() {
  try {
    console.log('Testing grade mapping logic...\n');
    
    await db.ensureInitialized();
    
    // Test data with various grade descriptions
    const testGrades = [
      'Existing - PA & e',
      'Existing - A & e', 
      'Existing - PAT & e',
      'Existing - SA & e',
      'Existing-M&e',
      'Existing-SM&e',
      'Existing-AD&e',
      'Business Associate 60',
      'Some Other Grade',
      'Senior Developer',
      ''
    ];
    
    console.log('Testing grade mapping rules:');
    
    testGrades.forEach(gradeDesc => {
      let gradeKey = (gradeDesc || 'Unknown').toString().trim();
      const originalGrade = gradeKey;
      
      // Apply the same mapping logic as in the endpoints
      if (gradeKey === 'Existing - PA & e' || gradeKey === 'Existing - A & e' || gradeKey === 'Existing - PAT & e') {
        gradeKey = 'PAT,PA,A';
      } else if (gradeKey === 'Existing - SA & e') {
        gradeKey = 'Senior Associate';
      } else if (gradeKey === 'Existing-M&e') {
        gradeKey = 'Manager';
      } else if (gradeKey === 'Existing-SM&e' || gradeKey === 'Existing-AD&e') {
        gradeKey = 'Senior Manager +';
      } else if (gradeKey === 'Business Associate 60') {
        gradeKey = 'BA';
      }
      
      console.log(`"${originalGrade}" -> "${gradeKey}"`);
    });
    
    // Test with actual database data if any exists
    console.log('\n=== Testing with actual database data ===');
    
    const allocGrades = db.all(`
      SELECT 
        GradeDescription,
        COUNT(*) as count
      FROM allocation_data 
      WHERE GradeDescription IS NOT NULL AND GradeDescription != ''
      GROUP BY GradeDescription
    `);
    
    if (allocGrades.length > 0) {
      console.log('Allocation data grades found:');
      const analytics = {};
      
      allocGrades.forEach(result => {
        const gradeDesc = result.GradeDescription || 'Unknown';
        let gradeKey = gradeDesc.toString().trim();
        
        // Apply mapping
        if (gradeKey === 'Existing - PA & e' || gradeKey === 'Existing - A & e' || gradeKey === 'Existing - PAT & e') {
          gradeKey = 'PAT,PA,A';
        } else if (gradeKey === 'Existing - SA & e') {
          gradeKey = 'Senior Associate';
        } else if (gradeKey === 'Existing-M&e') {
          gradeKey = 'Manager';
        } else if (gradeKey === 'Existing-SM&e' || gradeKey === 'Existing-AD&e') {
          gradeKey = 'Senior Manager +';
        } else if (gradeKey === 'Business Associate 60') {
          gradeKey = 'BA';
        }
        
        if (analytics[gradeKey]) {
          analytics[gradeKey] += result.count;
        } else {
          analytics[gradeKey] = result.count;
        }
        
        console.log(`  "${result.GradeDescription}" (${result.count}) -> "${gradeKey}"`);
      });
      
      console.log('\nFinal mapped analytics:');
      console.log(JSON.stringify(analytics, null, 2));
    } else {
      console.log('No allocation data found in database');
    }
    
    const newGrades = db.all(`
      SELECT 
        GradeDescription,
        COUNT(*) as count
      FROM new_allocations 
      WHERE GradeDescription IS NOT NULL AND GradeDescription != ''
      GROUP BY GradeDescription
    `);
    
    if (newGrades.length > 0) {
      console.log('\nNew allocation grades found:');
      newGrades.forEach(result => {
        console.log(`  "${result.GradeDescription}" (${result.count})`);
      });
    } else {
      console.log('No new allocation data found in database');
    }
    
  } catch (error) {
    console.error('Error testing grade mapping:', error);
  }
}

testGradeMapping();

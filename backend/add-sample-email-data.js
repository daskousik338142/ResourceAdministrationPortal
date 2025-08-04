const db = require('./config/database');

async function addSampleEmailData() {
  console.log('📧 Adding Sample Email Data\n');
  
  try {
    await db.ensureInitialized();
    
    // Sample email data
    const sampleEmails = [
      {
        name: 'John Smith',
        email: 'john.smith@manulife.com',
        description: 'Project Manager - Internal Operations',
        active: true
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@manulife.com',
        description: 'HR Director - Resource Management',
        active: true
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@manulife.com',
        description: 'Technical Lead - Development Team',
        active: true
      },
      {
        name: 'Emily Davis',
        email: 'emily.davis@manulife.com',
        description: 'Business Analyst - Requirements Team',
        active: false
      },
      {
        name: 'Admin Team',
        email: 'admin@manulife.com',
        description: 'System Administration Team',
        active: true
      }
    ];
    
    console.log('📝 Adding sample email records...');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const emailData of sampleEmails) {
      // Check if email already exists
      const existing = db.get('SELECT id FROM email_list WHERE email = ?', [emailData.email]);
      
      if (existing) {
        console.log(`⏩ Skipped: ${emailData.email} (already exists)`);
        skippedCount++;
        continue;
      }
      
      // Insert new email
      const result = db.run(`
        INSERT INTO email_list (name, email, description, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        emailData.name,
        emailData.email,
        emailData.description,
        emailData.active ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      console.log(`✅ Added: ${emailData.name} (${emailData.email}) - ID: ${result.lastInsertRowid}`);
      addedCount++;
    }
    
    console.log(`\n📊 Summary: Added ${addedCount}, Skipped ${skippedCount}\n`);
    
    // Display current email list
    const allEmails = db.all('SELECT * FROM email_list ORDER BY created_at DESC');
    console.log(`📋 Current Email List (${allEmails.length} total):`);
    
    allEmails.forEach((email, index) => {
      const status = email.active ? '🟢 Active' : '🔴 Inactive';
      console.log(`${index + 1}. ${email.name} - ${email.email} (${status})`);
      if (email.description) {
        console.log(`   📝 ${email.description}`);
      }
      console.log('');
    });
    
    console.log('🎯 Sample data added successfully!');
    console.log('You can now test the Admin page with real email data.');
    
  } catch (error) {
    console.error('❌ Error adding sample email data:', error);
  }
}

addSampleEmailData();

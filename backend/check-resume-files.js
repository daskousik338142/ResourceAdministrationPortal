const db = require('./config/database');

async function checkResumeFiles() {
  console.log('🔍 Checking Resume Files in Database...\n');

  try {
    await db.ensureInitialized();

    // Get all evaluations with resume files
    const evaluations = db.all(`
      SELECT id, associate_name, associate_id, email, resume_file, created_date
      FROM resource_evaluations 
      WHERE resume_file IS NOT NULL 
      ORDER BY created_date DESC
    `);

    console.log(`📊 Found ${evaluations.length} evaluations with resume files:\n`);

    evaluations.forEach((eval, index) => {
      console.log(`${index + 1}. ID: ${eval.id}`);
      console.log(`   Associate: ${eval.associate_name}`);
      console.log(`   Associate ID: ${eval.associate_id}`);
      console.log(`   Resume File: ${eval.resume_file}`);
      console.log(`   Created: ${eval.created_date}`);
      console.log('');
    });

    // List actual files in uploads directory
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads/resumes');
    
    console.log('📁 Actual files in uploads/resumes directory:');
    const files = fs.readdirSync(uploadsDir);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkResumeFiles();

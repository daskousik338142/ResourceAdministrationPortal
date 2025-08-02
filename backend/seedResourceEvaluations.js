const db = require('./config/database');

const sampleResourceEvaluations = [
  {
    associateId: 'EMP001',
    associateName: 'John Smith',
    resume: 'john_smith_resume.pdf',
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Excellent technical skills with strong communication abilities. Shows great potential for leadership roles.',
    internalEvaluation2Status: true,
    internalEvaluation2Feedback: 'Continues to demonstrate strong technical proficiency.',
    internalEvaluation3Status: null,
    internalEvaluation3Feedback: '',
    customerName: 'John Hancock Life Insurance Company- USA',
    clientInterviewStatus: true,
    clientInterviewFeedback: 'Client was impressed with communication skills and technical knowledge.',
    clientCodingEvaluationStatus: true,
    clientCodingEvaluationFeedback: 'Successfully completed coding challenges within time limit. Clean, well-documented code.',
    status: 'completed',
    createdAt: '2024-11-01T09:00:00.000Z',
    updatedAt: '2024-12-20T14:30:00.000Z'
  },
  {
    associateId: 'EMP002',
    associateName: 'Emily Davis',
    resume: 'emily_davis_resume.docx',
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Strong analytical skills and attention to detail.',
    internalEvaluation2Status: null,
    internalEvaluation2Feedback: '',
    internalEvaluation3Status: null,
    internalEvaluation3Feedback: '',
    customerName: 'Manulife Financial',
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    status: 'in-progress',
    createdAt: '2025-01-01T09:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z'
  },
  {
    associateId: 'EMP003',
    associateName: 'David Wilson',
    resume: 'david_wilson_resume.pdf',
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Strong team player with excellent communication skills.',
    customerName: 'Manulife Japan',
    clientInterviewStatus: true,
    clientInterviewFeedback: 'Positive feedback on problem-solving approach.',
    clientCodingEvaluationStatus: true,
    clientCodingEvaluationFeedback: 'Good coding practices and efficient solutions.',
    status: 'completed',
    createdAt: '2024-05-01T09:00:00.000Z',
    updatedAt: '2024-06-25T16:15:00.000Z'
  },
  {
    associateId: 'EMP004',
    associateName: 'Lisa Chen',
    resume: 'lisa_chen_resume.pdf',
    internalEvaluation1Status: null,
    internalEvaluation1Feedback: '',
    customerName: '',
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    status: 'pending',
    createdAt: '2024-12-15T09:00:00.000Z',
    updatedAt: '2024-12-15T09:00:00.000Z'
  },
  {
    associateId: 'EMP005',
    associateName: 'James Anderson',
    resume: 'james_anderson_resume.docx',
    internalEvaluation1Status: false,
    internalEvaluation1Feedback: 'Needs improvement in communication skills.',
    customerName: '',
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    status: 'pending',
    createdAt: '2024-11-15T09:00:00.000Z',
    updatedAt: '2024-12-01T09:00:00.000Z'
  },
  {
    associateId: 'EMP006',
    associateName: 'Maria Garcia',
    resume: 'maria_garcia_resume.pdf',
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Shows strong potential and adapts well to new challenges.',
    customerName: 'Manulife (Singapore) Pte Ltd',
    clientInterviewStatus: true,
    clientInterviewFeedback: 'Excellent presentation skills and technical knowledge.',
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    status: 'in-progress',
    createdAt: '2024-11-01T09:00:00.000Z',
    updatedAt: '2024-12-05T13:45:00.000Z'
  },
  {
    associateId: 'EMP007',
    associateName: 'Kevin Lee',
    resume: 'kevin_lee_resume.pdf',
    internalEvaluation1Status: null,
    internalEvaluation1Feedback: '',
    customerName: '',
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    status: 'pending',
    createdAt: '2025-01-15T09:00:00.000Z',
    updatedAt: '2025-01-15T09:00:00.000Z'
  }
];

async function seedResourceEvaluations() {
  try {
    console.log('Seeding resource evaluations...');
    
    // Clear existing data
    await new Promise((resolve, reject) => {
      db.getResourceEvaluationsDB().remove({}, { multi: true }, (err, numRemoved) => {
        if (err) reject(err);
        else {
          console.log(`Removed ${numRemoved} existing evaluations`);
          resolve();
        }
      });
    });

    // Insert sample data
    for (const evaluation of sampleResourceEvaluations) {
      await new Promise((resolve, reject) => {
        db.getResourceEvaluationsDB().insert(evaluation, (err, doc) => {
          if (err) reject(err);
          else {
            console.log(`Created evaluation for ${evaluation.resourceName} (${evaluation.status})`);
            resolve(doc);
          }
        });
      });
    }

    console.log('✅ Resource evaluations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding resource evaluations:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  seedResourceEvaluations()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedResourceEvaluations, sampleResourceEvaluations };

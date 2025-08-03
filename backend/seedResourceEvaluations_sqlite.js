const db = require('./config/database');
const sampleResourceEvaluations = [
  {
    associateId: 'EMP001',
    associateName: 'John Smith',
    customerName: 'John Hancock Life Insurance Company- USA',
    resume: {
      filename: 'john_smith_resume.pdf',
      originalName: 'john_smith_resume.pdf',
      path: 'uploads/resumes/john_smith_resume.pdf',
      size: 524288,
      uploadedAt: '2024-11-01T09:00:00.000Z'
    },
    createdAt: '2024-11-01T09:00:00.000Z',
    updatedAt: '2024-11-20T17:00:00.000Z',
    // Internal Evaluation 1
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Excellent technical skills with strong communication abilities. Shows great potential for leadership roles.',
    // Internal Evaluation 2
    internalEvaluation2Status: true,
    internalEvaluation2Feedback: 'Continues to demonstrate strong technical proficiency and team collaboration.',
    // Internal Evaluation 3
    internalEvaluation3Status: null,
    internalEvaluation3Feedback: '',
    // Client Interview
    clientInterviewStatus: true,
    clientInterviewFeedback: 'Client was impressed with communication skills and technical knowledge.',
    // Client Coding Assignment
    clientCodingEvaluationStatus: true,
    clientCodingEvaluationFeedback: 'Successfully completed coding challenges within time limit. Clean, well-documented code.',
    // Overall Status
    status: 'completed'
  },
  {
    associateId: 'EMP002',
    associateName: 'Emily Davis',
    customerName: 'Manulife Financial',
    resume: {
      filename: 'emily_davis_resume.docx',
      originalName: 'emily_davis_resume.docx',
      path: 'uploads/resumes/emily_davis_resume.docx',
      size: 298752,
      uploadedAt: '2025-01-01T09:00:00.000Z'
    },
    createdAt: '2025-01-01T09:00:00.000Z',
    updatedAt: '2025-01-05T11:30:00.000Z',
    // Internal Evaluation 1
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Strong analytical skills and attention to detail.',
    // Internal Evaluation 2
    internalEvaluation2Status: null,
    internalEvaluation2Feedback: '',
    // Internal Evaluation 3
    internalEvaluation3Status: null,
    internalEvaluation3Feedback: '',
    // Client Interview
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    // Client Coding Assignment
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    // Overall Status
    status: 'in-progress'
  },
  {
    associateId: 'EMP003',
    associateName: 'David Wilson',
    customerName: 'Manulife Japan',
    resume: {
      filename: 'david_wilson_resume.pdf',
      originalName: 'david_wilson_resume.pdf',
      path: 'uploads/resumes/david_wilson_resume.pdf',
      size: 456789,
      uploadedAt: '2024-05-01T09:00:00.000Z'
    },
    createdAt: '2024-05-01T09:00:00.000Z',
    updatedAt: '2024-05-27T16:30:00.000Z',
    // Internal Evaluation 1
    internalEvaluation1Status: true,
    internalEvaluation1Feedback: 'Strong team player with excellent communication skills.',
    // Internal Evaluation 2
    internalEvaluation2Status: true,
    internalEvaluation2Feedback: 'Demonstrates good problem-solving approach and technical understanding.',
    // Internal Evaluation 3
    internalEvaluation3Status: true,
    internalEvaluation3Feedback: 'Shows leadership potential and ability to work under pressure.',
    // Client Interview
    clientInterviewStatus: true,
    clientInterviewFeedback: 'Positive feedback on problem-solving approach and cultural fit.',
    // Client Coding Assignment
    clientCodingEvaluationStatus: true,
    clientCodingEvaluationFeedback: 'Good coding practices and efficient solutions.',
    // Overall Status
    status: 'completed'
  },
  {
    associateId: 'EMP004',
    associateName: 'Lisa Chen',
    customerName: '',
    resume: {
      filename: 'lisa_chen_resume.pdf',
      originalName: 'lisa_chen_resume.pdf',
      path: 'uploads/resumes/lisa_chen_resume.pdf',
      size: 387654,
      uploadedAt: '2024-12-15T09:00:00.000Z'
    },
    createdAt: '2024-12-15T09:00:00.000Z',
    updatedAt: '2024-12-15T09:00:00.000Z',
    // Internal Evaluation 1
    internalEvaluation1Status: null,
    internalEvaluation1Feedback: '',
    // Internal Evaluation 2
    internalEvaluation2Status: null,
    internalEvaluation2Feedback: '',
    // Internal Evaluation 3
    internalEvaluation3Status: null,
    internalEvaluation3Feedback: '',
    // Client Interview
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    // Client Coding Assignment
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    // Overall Status
    status: 'pending'
  },
  {
    associateId: 'EMP005',
    associateName: 'James Anderson',
    customerName: '',
    resume: {
      filename: 'james_anderson_resume.docx',
      originalName: 'james_anderson_resume.docx',
      path: 'uploads/resumes/james_anderson_resume.docx',
      size: 234567,
      uploadedAt: '2024-11-15T09:00:00.000Z'
    },
    createdAt: '2024-11-15T09:00:00.000Z',
    updatedAt: '2024-11-20T10:00:00.000Z',
    // Internal Evaluation 1
    internalEvaluation1Status: false,
    internalEvaluation1Feedback: 'Needs improvement in communication skills.',
    // Internal Evaluation 2
    internalEvaluation2Status: null,
    internalEvaluation2Feedback: '',
    // Internal Evaluation 3
    internalEvaluation3Status: null,
    internalEvaluation3Feedback: '',
    // Client Interview
    clientInterviewStatus: null,
    clientInterviewFeedback: '',
    // Client Coding Assignment
    clientCodingEvaluationStatus: null,
    clientCodingEvaluationFeedback: '',
    // Overall Status
    status: 'rejected'
  }
];
const seedResourceEvaluations = async () => {
  try {
    // Ensure database is initialized
    await db.ensureInitialized();
    const resourceEvaluationsDB = db.getResourceEvaluationsDB();
    // Clear existing data
    try {
      db.run('DELETE FROM resource_evaluations');
    } catch (error) {
    }
    // Insert sample data
    for (const evaluation of sampleResourceEvaluations) {
      try {
        const result = resourceEvaluationsDB.insert(evaluation);
      } catch (error) {
      }
    }
    // Log summary
    const completed = sampleResourceEvaluations.filter(e => e.status === 'completed').length;
    const pending = sampleResourceEvaluations.filter(e => e.status === 'pending').length;
    const inProgress = sampleResourceEvaluations.filter(e => e.status === 'in-progress').length;
    const rejected = sampleResourceEvaluations.filter(e => e.status === 'rejected').length;
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};
if (require.main === module) {
  seedResourceEvaluations();
}
module.exports = { seedResourceEvaluations, sampleResourceEvaluations };

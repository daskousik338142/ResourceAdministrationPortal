const express = require('express');
const router = express.Router();

// This will be injected when the route is registered
let emailService = null;

// Initialize email service reference
const setEmailService = (service) => {
  emailService = service;
};

// GET /api/emails - Get all received emails
router.get('/', (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const emails = emailService.getReceivedEmails();
    res.json({
      success: true,
      count: emails.length,
      data: emails.map(email => ({
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        timestamp: email.timestamp,
        hasBody: !!email.body
      }))
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching emails',
      error: error.message
    });
  }
});

// GET /api/emails/:id - Get specific email by ID
router.get('/:id', (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const email = emailService.getEmailById(req.params.id);
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: email
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email',
      error: error.message
    });
  }
});

// POST /api/emails/send - Send an email
router.post('/send', async (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const { to, subject, text, html } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject'
      });
    }

    if (!text && !html) {
      return res.status(400).json({
        success: false,
        message: 'Either text or html content is required'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      text,
      html
    });

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending email',
      error: error.message
    });
  }
});

// POST /api/emails/send-summary - Send NBL summary email
router.post('/send-summary', async (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const { recipient, summaryData } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email address is required'
      });
    }

    if (!summaryData) {
      return res.status(400).json({
        success: false,
        message: 'Summary data is required'
      });
    }

    const result = await emailService.sendNBLSummaryEmail(recipient, summaryData);

    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Summary email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send summary email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending summary email:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending summary email',
      error: error.message
    });
  }
});

// DELETE /api/emails - Clear all received emails
router.delete('/', (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    const result = emailService.clearEmails();
    res.json(result);
  } catch (error) {
    console.error('Error clearing emails:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing emails',
      error: error.message
    });
  }
});

// GET /api/emails/status/server - Get SMTP server status
router.get('/status/server', (req, res) => {
  try {
    if (!emailService) {
      return res.status(503).json({
        success: false,
        message: 'Email service not available'
      });
    }

    res.json({
      success: true,
      status: 'running',
      port: 2525,
      host: '127.0.0.1',
      emailCount: emailService.getReceivedEmails().length
    });
  } catch (error) {
    console.error('Error getting server status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting server status',
      error: error.message
    });
  }
});

module.exports = { router, setEmailService };

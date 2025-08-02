const nodemailer = require('nodemailer');
const { SMTPServer } = require('smtp-server');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.smtpServer = null;
    this.transporter = null;
    this.emails = []; // Store received emails in memory
    this.init();
  }

  async init() {
    try {
      // Start embedded SMTP server
      await this.startSMTPServer();
      
      // Create nodemailer transporter
      this.createTransporter();
      
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  startSMTPServer() {
    return new Promise((resolve, reject) => {
      this.smtpServer = new SMTPServer({
        port: 2525, // Use port 2525 for embedded SMTP
        authOptional: true,
        disabledCommands: ['STARTTLS'], // Disable TLS for simplicity
        onData: (stream, session, callback) => {
          let emailData = '';
          
          stream.on('data', (chunk) => {
            emailData += chunk;
          });
          
          stream.on('end', () => {
            // Parse and store the email
            const email = this.parseEmail(emailData, session);
            this.emails.push(email);
            console.log('Email received:', {
              from: email.from,
              to: email.to,
              subject: email.subject,
              timestamp: email.timestamp
            });
            callback();
          });
        },
        onConnect: (session, callback) => {
          console.log('SMTP connection from:', session.remoteAddress);
          callback();
        },
        onAuth: (auth, session, callback) => {
          // Accept any authentication for simplicity
          callback(null, { user: auth.username });
        }
      });

      this.smtpServer.listen(2525, '127.0.0.1', (err) => {
        if (err) {
          console.error('Failed to start SMTP server:', err);
          reject(err);
        } else {
          console.log('Embedded SMTP server listening on port 2525');
          resolve();
        }
      });
    });
  }

  createTransporter() {
    this.transporter = nodemailer.createTransport({
      host: '127.0.0.1',
      port: 2525,
      secure: false, // No TLS
      auth: false,   // No authentication required
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  parseEmail(rawEmail, session) {
    const lines = rawEmail.split('\r\n');
    const email = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      from: session.envelope.mailFrom ? session.envelope.mailFrom.address : 'unknown',
      to: session.envelope.rcptTo.map(addr => addr.address),
      raw: rawEmail,
      headers: {},
      subject: '',
      body: ''
    };

    let inHeaders = true;
    let bodyLines = [];

    for (const line of lines) {
      if (inHeaders) {
        if (line === '') {
          inHeaders = false;
          continue;
        }
        
        const headerMatch = line.match(/^([^:]+):\s*(.*)$/);
        if (headerMatch) {
          const [, key, value] = headerMatch;
          email.headers[key.toLowerCase()] = value;
          
          if (key.toLowerCase() === 'subject') {
            email.subject = value;
          }
        }
      } else {
        bodyLines.push(line);
      }
    }

    email.body = bodyLines.join('\n').trim();
    return email;
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: options.from || 'noreply@resourceportal.local',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });
      
      return {
        success: true,
        messageId: info.messageId,
        info: info
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getReceivedEmails() {
    return this.emails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getEmailById(id) {
    return this.emails.find(email => email.id == id);
  }

  clearEmails() {
    this.emails = [];
    return { success: true, message: 'All emails cleared' };
  }

  async sendNBLSummaryEmail(recipient, summaryData) {
    const htmlContent = this.generateSummaryEmailHTML(summaryData);
    const textContent = this.generateSummaryEmailText(summaryData);

    return await this.sendEmail({
      to: recipient,
      subject: `NBL Summary Report - ${new Date().toLocaleDateString()}`,
      text: textContent,
      html: htmlContent
    });
  }

  generateSummaryEmailHTML(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 30px -30px; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-card { background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #1f2937; margin: 0; }
        .stat-label { color: #6b7280; font-size: 12px; margin: 5px 0 0 0; }
        .breakdown-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .breakdown-table th, .breakdown-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .breakdown-table th { background: #f9fafb; font-weight: 600; }
        .main-row { background: #fafafa; }
        .sub-row { background: white; }
        .sub-category { padding-left: 30px; color: #6b7280; font-style: italic; }
        .footer { color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">NBL Summary Report</h1>
          <p style="margin: 10px 0 0 0;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-number">${data.totalRecords || 0}</p>
            <p class="stat-label">Total Records</p>
          </div>
          <div class="stat-card">
            <p class="stat-number">${data.gencPaCount || 0}</p>
            <p class="stat-label">GenC/PA Records</p>
          </div>
          <div class="stat-card">
            <p class="stat-number">${data.nonGencCount || 0}</p>
            <p class="stat-label">Non-GenC Records</p>
          </div>
          <div class="stat-card">
            <p class="stat-number">${data.nblForMonthCount || 0}</p>
            <p class="stat-label">NBL for Month</p>
          </div>
        </div>

        <h2>Detailed Breakdown</h2>
        <table class="breakdown-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            <tr class="main-row">
              <td>GenC/PA Records</td>
              <td>${data.gencPaCount || 0}</td>
              <td>${data.totalRecords > 0 ? ((data.gencPaCount / data.totalRecords) * 100).toFixed(1) : '0'}%</td>
            </tr>
            <tr class="main-row">
              <td>Non-GenC Records</td>
              <td>${data.nonGencCount || 0}</td>
              <td>${data.totalRecords > 0 ? ((data.nonGencCount / data.totalRecords) * 100).toFixed(1) : '0'}%</td>
            </tr>
            <tr class="sub-row">
              <td class="sub-category">↳ Already Billed</td>
              <td>${data.billedCount || 0}</td>
              <td>${data.totalRecords > 0 ? ((data.billedCount / data.totalRecords) * 100).toFixed(1) : '0'}%</td>
            </tr>
            <tr class="sub-row">
              <td class="sub-category">↳ Awaiting Billing</td>
              <td>${data.awaitingBillingCount || 0}</td>
              <td>${data.totalRecords > 0 ? ((data.awaitingBillingCount / data.totalRecords) * 100).toFixed(1) : '0'}%</td>
            </tr>
            <tr class="sub-row">
              <td class="sub-category">↳ NBL for Month</td>
              <td>${data.nblForMonthCount || 0}</td>
              <td>${data.totalRecords > 0 ? ((data.nblForMonthCount / data.totalRecords) * 100).toFixed(1) : '0'}%</td>
            </tr>
            ${Object.entries(data.nblForMonthSecondaryBreakdown || {}).map(([category, count]) => `
            <tr class="sub-row">
              <td class="sub-category" style="padding-left: 45px;">↳ ${category}</td>
              <td>${count}</td>
              <td>${data.totalRecords > 0 ? ((count / data.totalRecords) * 100).toFixed(1) : '0'}%</td>
            </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>This report was automatically generated by the Resource Management Portal.</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateSummaryEmailText(data) {
    let text = `NBL Summary Report - ${new Date().toLocaleDateString()}\n\n`;
    text += `OVERVIEW:\n`;
    text += `Total Records: ${data.totalRecords || 0}\n`;
    text += `GenC/PA Records: ${data.gencPaCount || 0}\n`;
    text += `Non-GenC Records: ${data.nonGencCount || 0}\n`;
    text += `NBL for Month: ${data.nblForMonthCount || 0}\n\n`;
    
    text += `DETAILED BREAKDOWN:\n`;
    text += `GenC/PA Records: ${data.gencPaCount || 0} (${data.totalRecords > 0 ? ((data.gencPaCount / data.totalRecords) * 100).toFixed(1) : '0'}%)\n`;
    text += `Non-GenC Records: ${data.nonGencCount || 0} (${data.totalRecords > 0 ? ((data.nonGencCount / data.totalRecords) * 100).toFixed(1) : '0'}%)\n`;
    text += `  └ Already Billed: ${data.billedCount || 0} (${data.totalRecords > 0 ? ((data.billedCount / data.totalRecords) * 100).toFixed(1) : '0'}%)\n`;
    text += `  └ Awaiting Billing: ${data.awaitingBillingCount || 0} (${data.totalRecords > 0 ? ((data.awaitingBillingCount / data.totalRecords) * 100).toFixed(1) : '0'}%)\n`;
    text += `  └ NBL for Month: ${data.nblForMonthCount || 0} (${data.totalRecords > 0 ? ((data.nblForMonthCount / data.totalRecords) * 100).toFixed(1) : '0'}%)\n`;
    
    if (data.nblForMonthSecondaryBreakdown) {
      Object.entries(data.nblForMonthSecondaryBreakdown).forEach(([category, count]) => {
        text += `    └ ${category}: ${count} (${data.totalRecords > 0 ? ((count / data.totalRecords) * 100).toFixed(1) : '0'}%)\n`;
      });
    }
    
    text += `\nThis report was automatically generated by the Resource Management Portal.`;
    return text;
  }

  async shutdown() {
    if (this.smtpServer) {
      this.smtpServer.close(() => {
        console.log('SMTP server closed');
      });
    }
  }
}

module.exports = EmailService;

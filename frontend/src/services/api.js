import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

class ApiService {
  constructor() {
    console.log('API Base URL:', API_BASE_URL);
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for debugging
    this.api.interceptors.request.use(
      (config) => {
        console.log('Making API request to:', config.baseURL + config.url);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Resource endpoints
  getResources(params = {}) {
    return this.api.get('/resources', { params });
  }

  getResource(id) {
    return this.api.get(`/resources/${id}`);
  }

  createResource(resourceData) {
    return this.api.post('/resources', resourceData);
  }

  updateResource(id, resourceData) {
    return this.api.put(`/resources/${id}`, resourceData);
  }

  deleteResource(id) {
    return this.api.delete(`/resources/${id}`);
  }

  // NBL List endpoints
  getNBLList() {
    return this.api.get('/nbl-list');
  }

  uploadNBLData(data, fileName, headers) {
    return this.api.post('/nbl-list/upload', {
      data,
      fileName,
      headers
    });
  }

  updateNBLRecord(id, recordData) {
    return this.api.put(`/nbl-list/${id}`, recordData);
  }

  clearNBLData() {
    return this.api.delete('/nbl-list');
  }

  getNBLStats() {
    return this.api.get('/nbl-list/stats');
  }

  getNBLRecordsByCategory(categoryName) {
    return this.api.get(`/nbl-list/category/${encodeURIComponent(categoryName)}`);
  }

  getNBLBreakdown() {
    return this.api.get('/nbl-list/breakdown');
  }

  // Health check
  healthCheck() {
    return this.api.get('/health');
  }

  // Email service methods
  async sendEmail(emailData) {
    try {
      console.log('Sending email:', emailData);
      const response = await this.api.post('/emails/send', emailData);
      console.log('Email sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendSummaryEmail(recipient, summaryData) {
    try {
      console.log('Sending summary email to:', recipient);
      const response = await this.api.post('/emails/send-summary', {
        recipient,
        summaryData
      });
      console.log('Summary email sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending summary email:', error);
      throw error;
    }
  }

  async getReceivedEmails() {
    try {
      console.log('Fetching received emails');
      const response = await this.api.get('/emails');
      console.log('Received emails fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching received emails:', error);
      throw error;
    }
  }

  async getEmailById(id) {
    try {
      console.log('Fetching email by ID:', id);
      const response = await this.api.get(`/emails/${id}`);
      console.log('Email fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching email:', error);
      throw error;
    }
  }

  async clearReceivedEmails() {
    try {
      console.log('Clearing received emails');
      const response = await this.api.delete('/emails');
      console.log('Emails cleared successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error clearing emails:', error);
      throw error;
    }
  }

  async getEmailServerStatus() {
    try {
      console.log('Getting email server status');
      const response = await this.api.get('/emails/status/server');
      console.log('Email server status:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting email server status:', error);
      throw error;
    }
  }

  // Email List management methods
  async getEmailList() {
    try {
      console.log('Fetching email list');
      const response = await this.api.get('/email-list');
      console.log('Email list fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching email list:', error);
      throw error;
    }
  }

  async addEmailToList(emailData) {
    try {
      console.log('Adding email to list:', emailData);
      const response = await this.api.post('/email-list', emailData);
      console.log('Email added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding email:', error);
      throw error;
    }
  }

  async updateEmailInList(id, emailData) {
    try {
      console.log('Updating email in list:', id, emailData);
      const response = await this.api.put(`/email-list/${id}`, emailData);
      console.log('Email updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  async deleteEmailFromList(id) {
    try {
      console.log('Deleting email from list:', id);
      const response = await this.api.delete(`/email-list/${id}`);
      console.log('Email deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  }

  async getActiveEmails() {
    try {
      console.log('Fetching active emails');
      const response = await this.api.get('/email-list/active');
      console.log('Active emails fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching active emails:', error);
      throw error;
    }
  }

  async sendSummaryToAllEmails(summaryData) {
    try {
      console.log('Sending summary to all active emails');
      const response = await this.api.post('/email-list/send-summary', { summaryData });
      console.log('Summary emails sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending summary emails:', error);
      throw error;
    }
  }

  // NBL List headers endpoints
  getSavedHeaders() {
    return this.api.get('/nbl-list/headers');
  }

  saveHeaders(headers) {
    return this.api.post('/nbl-list/headers', { headers });
  }
}

export default new ApiService();

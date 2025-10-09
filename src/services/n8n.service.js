const axios = require('axios');

class N8nService {
  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL;
  }

  /**
   * Extract text from an image using n8n workflow
   * Simplified implementation for MVP
   */
  async extractTextFromImage(imageData) {
    try {
      // Send to n8n webhook
      const response = await axios.post(this.webhookUrl, {
        action: 'extract-text',
        data: {
          image: imageData.base64 || imageData.url,
          filename: imageData.filename,
          documentId: imageData.documentId
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      // Handle response
      const result = response.data;
      
      return {
        success: true,
        extractedText: result.text || result.extractedText || result.data?.text || '',
        confidence: result.confidence || 0.85,
        method: 'n8n',
        processedAt: new Date()
      };
    } catch (error) {
      console.error('n8n text extraction error:', error.message);
      
      // Fallback: Return error but don't crash
      return {
        success: false,
        error: error.message,
        extractedText: '',
        confidence: 0,
        method: 'n8n'
      };
    }
  }

  /**
   * Generate tasks from document content using n8n workflow
   * Simplified - limit to 5 tasks max for MVP
   */
  async generateTasksFromDocument(documentData) {
    try {
      // Send to n8n webhook
      const response = await axios.post(this.webhookUrl, {
        action: 'generate-tasks',
        data: {
          content: documentData.content,
          documentType: documentData.type,
          projectId: documentData.projectId,
          documentId: documentData.documentId,
          maxTasks: 5 // Limit to 5 tasks for MVP
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 45000 // 45 second timeout for task generation
      });

      const result = response.data;
      const tasks = result.tasks || result.data?.tasks || [];
      
      // Limit to 5 tasks max
      const limitedTasks = tasks.slice(0, 5);
      
      return {
        success: true,
        tasks: limitedTasks.map(task => ({
          title: task.title || task.name,
          description: task.description || '',
          priority: task.priority || 'medium',
          deadline: task.deadline ? new Date(task.deadline) : this.getDefaultDeadline(),
          estimatedHours: task.estimatedHours || 0,
          category: task.category || 'general'
        })),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('n8n task generation error:', error.message);
      
      return {
        success: false,
        error: error.message,
        tasks: []
      };
    }
  }

  /**
   * Process document with combined text extraction and task generation
   * Simplified single request to n8n
   */
  async processDocument(documentData) {
    try {
      // Send single request to n8n for complete processing
      const response = await axios.post(this.webhookUrl, {
        action: 'process-document',
        data: {
          image: documentData.url || documentData.base64,
          filename: documentData.filename,
          isImage: documentData.isImage,
          content: documentData.content,
          type: documentData.type,
          projectId: documentData.projectId,
          documentId: documentData.documentId,
          maxTasks: 5 // Limit to 5 tasks
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for full processing
      });

      const result = response.data;
      const extractedText = result.text || result.extractedText || result.data?.text || '';
      const tasks = (result.tasks || result.data?.tasks || []).slice(0, 5);

      return {
        success: true,
        extractedText,
        tasks: tasks.map(task => ({
          title: task.title || task.name,
          description: task.description || '',
          priority: task.priority || 'medium',
          deadline: task.deadline ? new Date(task.deadline) : this.getDefaultDeadline(),
          estimatedHours: task.estimatedHours || 0,
          category: task.category || 'general'
        })),
        processedAt: new Date()
      };
    } catch (error) {
      console.error('n8n document processing error:', error.message);
      
      return {
        success: false,
        error: error.message,
        extractedText: '',
        tasks: []
      };
    }
  }

  /**
   * Check n8n workflow health
   */
  async checkHealth() {
    try {
      const response = await axios.post(this.webhookUrl, {
        action: 'health-check'
      }, {
        timeout: 5000
      });
      
      return {
        available: true,
        status: response.data.status || 'healthy',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        available: false,
        status: 'unavailable',
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get default deadline (7 days from now)
   */
  getDefaultDeadline() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return deadline;
  }
}

module.exports = new N8nService();


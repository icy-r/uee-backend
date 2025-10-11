const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Model for general text tasks (materials, budget, sustainability)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    // Model for vision tasks (OCR, image analysis)
    this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    // Model for complex text analysis (task generation)
    this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  /**
   * Estimate material quantities based on project details
   */
  async estimateMaterials(projectData) {
    try {
      const { projectType, projectSize, duration, location } = projectData;
      
      const prompt = `You are an expert construction material estimator. Based on the following project details, estimate the required material quantities:

Project Type: ${projectType}
Project Size: ${projectSize.value} ${projectSize.unit}
Duration: ${duration} months
Location: ${location}

Please provide detailed material estimates in the following JSON format:
{
  "materials": [
    {
      "name": "material name",
      "category": "category",
      "estimatedQuantity": number,
      "unit": "unit",
      "confidence": "high/medium/low",
      "reasoning": "brief explanation"
    }
  ],
  "notes": "general recommendations",
  "estimationBasis": "methodology used"
}

Focus on essential construction materials like cement, steel, bricks, sand, gravel, wood, etc. Be specific with quantities based on industry standards and the project size.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        materials: [],
        notes: text,
        estimationBasis: 'AI-generated estimate'
      };
    } catch (error) {
      console.error('Material estimation error:', error);
      throw new Error('Failed to estimate materials: ' + error.message);
    }
  }

  /**
   * Predict material costs based on market trends
   */
  async predictCosts(costData) {
    try {
      const { materials, location, timeframe } = costData;
      
      const materialsStr = materials.map(m => 
        `${m.name}: Current price ${m.currentPrice} ${m.currency}/${m.unit}`
      ).join('\n');

      const prompt = `You are a construction cost analysis expert. Analyze market trends and predict future material costs:

Materials:
${materialsStr}

Location: ${location}
Prediction Timeframe: ${timeframe} months

Provide predictions in the following JSON format:
{
  "predictions": [
    {
      "materialName": "material name",
      "currentPrice": number,
      "predictedPrice": number,
      "priceChange": number,
      "trend": "increasing/decreasing/stable",
      "confidence": number (0-100),
      "reasoning": "explanation"
    }
  ],
  "marketFactors": ["factor1", "factor2"],
  "recommendations": "cost optimization suggestions"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        predictions: [],
        marketFactors: [],
        recommendations: text
      };
    } catch (error) {
      console.error('Cost prediction error:', error);
      throw new Error('Failed to predict costs: ' + error.message);
    }
  }

  /**
   * Forecast project completion based on current progress
   */
  async predictProgress(progressData) {
    try {
      const {
        currentProgress,
        tasksCompleted,
        totalTasks,
        teamSize,
        weatherImpact,
        startDate,
        expectedEndDate
      } = progressData;

      const prompt = `You are a project management expert specializing in construction. Predict the project completion date based on:

Current Progress: ${currentProgress}%
Tasks Completed: ${tasksCompleted} / ${totalTasks}
Team Size: ${teamSize} workers
Weather Impact: ${weatherImpact}
Start Date: ${startDate}
Expected End Date: ${expectedEndDate}

Provide your prediction in the following JSON format:
{
  "predictedCompletionDate": "YYYY-MM-DD",
  "confidenceInterval": {
    "earliest": "YYYY-MM-DD",
    "latest": "YYYY-MM-DD"
  },
  "confidence": number (0-100),
  "delayRisk": "low/medium/high",
  "factors": ["factor1", "factor2"],
  "recommendations": "suggestions to meet deadline"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        predictedCompletionDate: expectedEndDate,
        confidence: 50,
        recommendations: text
      };
    } catch (error) {
      console.error('Progress prediction error:', error);
      throw new Error('Failed to predict progress: ' + error.message);
    }
  }

  /**
   * Calculate and provide sustainability recommendations
   */
  async analyzeSustainability(sustainabilityData) {
    try {
      const {
        materials,
        wasteGenerated,
        energyUsage,
        currentScore
      } = sustainabilityData;

      const materialsStr = materials.map(m =>
        `${m.name} (${m.quantity} ${m.unit}) - Eco-friendly: ${m.ecoFriendly ? 'Yes' : 'No'}`
      ).join('\n');

      const prompt = `You are a sustainability expert in construction. Analyze the environmental impact and provide recommendations:

Materials Used:
${materialsStr}

Total Waste Generated: ${wasteGenerated}
Energy Usage: ${energyUsage}
Current Sustainability Score: ${currentScore}/100

Provide analysis in the following JSON format:
{
  "score": number (0-100),
  "breakdown": {
    "materials": number (0-100),
    "wasteManagement": number (0-100),
    "energyEfficiency": number (0-100)
  },
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": [
    {
      "category": "category",
      "suggestion": "specific action",
      "impact": "high/medium/low",
      "implementationCost": "high/medium/low"
    }
  ],
  "certificationPotential": "LEED/BREEAM level if applicable"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        score: currentScore,
        recommendations: [{ suggestion: text }]
      };
    } catch (error) {
      console.error('Sustainability analysis error:', error);
      throw new Error('Failed to analyze sustainability: ' + error.message);
    }
  }

  /**
   * Optimize budget allocation using AI
   */
  async optimizeBudget(budgetData) {
    try {
      const {
        totalBudget,
        currentAllocations,
        expenses,
        projectPhase
      } = budgetData;

      const prompt = `You are a construction finance expert. Optimize budget allocation for maximum efficiency:

Total Budget: ${totalBudget}
Current Allocations:
- Materials: ${currentAllocations.materials}
- Labor: ${currentAllocations.labor}
- Equipment: ${currentAllocations.equipment}
- Other: ${currentAllocations.other}

Total Spent: ${expenses}
Project Phase: ${projectPhase}

Provide optimization suggestions in JSON format:
{
  "optimizedAllocations": {
    "materials": number,
    "labor": number,
    "equipment": number,
    "other": number
  },
  "savings": number,
  "recommendations": [
    {
      "area": "category",
      "suggestion": "specific recommendation",
      "potentialSavings": number,
      "priority": "high/medium/low"
    }
  ],
  "riskFactors": ["risk1", "risk2"],
  "contingencyAdvice": "advice on contingency fund"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        optimizedAllocations: currentAllocations,
        recommendations: [{ suggestion: text }]
      };
    } catch (error) {
      console.error('Budget optimization error:', error);
      throw new Error('Failed to optimize budget: ' + error.message);
    }
  }

  /**
   * Extract text from an image using Gemini Vision
   * Replaces n8n text extraction
   */
  async extractTextFromImage(imageData) {
    try {
      const { filePath, filename, documentId } = imageData;

      if (!filePath) {
        throw new Error('File path is required for text extraction');
      }

      // Read the image file
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');

      // Prepare image data for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: this.getMimeType(filename)
        }
      };

      const prompt = `You are an expert OCR system. Extract ALL text from this image accurately.

Requirements:
- Extract text exactly as it appears
- Maintain the structure and formatting
- Include all visible text, labels, numbers, and annotations
- If it's a construction document (plans, permits, invoices), identify document type
- Return clean, structured text

Provide the extracted text directly without any additional commentary.`;

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const extractedText = response.text();

      console.log(`✅ Gemini Vision extracted text from ${filename}: ${extractedText.length} characters`);

      return {
        success: true,
        extractedText: extractedText.trim(),
        confidence: 0.9, // Gemini Vision generally high confidence
        method: 'gemini-vision',
        processedAt: new Date(),
        documentId
      };
    } catch (error) {
      console.error('Gemini Vision text extraction error:', error.message);
      
      // Return error but don't crash
      return {
        success: false,
        error: error.message,
        extractedText: '',
        confidence: 0,
        method: 'gemini-vision',
        fallbackNeeded: true
      };
    }
  }

  /**
   * Generate construction tasks from extracted document text
   * Replaces n8n task generation
   */
  async generateTasksFromText(content, documentType, projectId) {
    try {
      if (!content || content.trim().length < 10) {
        return {
          success: false,
          error: 'Insufficient content for task generation',
          tasks: []
        };
      }

      const prompt = `You are an expert construction project manager. Analyze this document content and generate actionable construction tasks.

Document Type: ${documentType || 'unknown'}
Content:
${content}

Generate up to 5 specific, actionable tasks based on this document. For each task, provide:

Return your response in the following JSON format:
{
  "tasks": [
    {
      "title": "Brief task title (max 100 chars)",
      "description": "Detailed description of what needs to be done",
      "priority": "high/medium/low",
      "category": "construction/inspection/material/permit/safety/other",
      "estimatedHours": number (1-40),
      "deadline": "YYYY-MM-DD" (7-30 days from now based on priority)
    }
  ]
}

Rules:
- Only generate tasks that are clearly indicated in the document
- Be specific and actionable
- Prioritize based on urgency and importance
- Limit to 5 most important tasks
- If no clear tasks, return empty array`;

      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in Gemini response for task generation');
        return {
          success: false,
          error: 'Could not parse tasks from AI response',
          tasks: []
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const tasks = (parsed.tasks || []).slice(0, 5); // Limit to 5 tasks

      // Validate and format tasks
      const formattedTasks = tasks.map(task => ({
        title: task.title || 'Unnamed Task',
        description: task.description || '',
        priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
        deadline: task.deadline ? new Date(task.deadline) : this.getDefaultDeadline(),
        estimatedHours: task.estimatedHours || 0,
        category: task.category || 'general'
      }));

      console.log(`✅ Gemini generated ${formattedTasks.length} tasks from document`);

      return {
        success: true,
        tasks: formattedTasks,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Gemini task generation error:', error.message);
      
      return {
        success: false,
        error: error.message,
        tasks: []
      };
    }
  }

  /**
   * Process document with combined text extraction and task generation
   * Replaces n8n document processing workflow
   */
  async processDocument(documentData) {
    try {
      const { filePath, filename, isImage, content, type, projectId, documentId } = documentData;

      let extractedText = content || '';

      // Step 1: Extract text from image if needed
      if (isImage && filePath) {
        const extractResult = await this.extractTextFromImage({
          filePath,
          filename,
          documentId
        });

        if (extractResult.success) {
          extractedText = extractResult.extractedText;
        } else if (extractResult.fallbackNeeded) {
          // Return with fallback flag for controller to try Cloud Vision
          return {
            success: false,
            error: 'Gemini extraction failed, fallback needed',
            extractedText: '',
            tasks: [],
            fallbackNeeded: true
          };
        }
      }

      // Step 2: Generate tasks from extracted text
      const taskResult = await this.generateTasksFromText(
        extractedText,
        type,
        projectId
      );

      const tasks = taskResult.success ? taskResult.tasks : [];

      console.log(`✅ Gemini processed document: ${extractedText.length} chars, ${tasks.length} tasks`);

      return {
        success: true,
        extractedText,
        tasks,
        processedAt: new Date(),
        method: 'gemini-ai'
      };
    } catch (error) {
      console.error('Gemini document processing error:', error.message);
      
      return {
        success: false,
        error: error.message,
        extractedText: '',
        tasks: []
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

  /**
   * Get MIME type from filename
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }
}

module.exports = new GeminiService();


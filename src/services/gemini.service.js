const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
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
}

module.exports = new GeminiService();


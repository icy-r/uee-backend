const Material = require('../models/Material');
const Waste = require('../models/Waste');
const Project = require('../models/Project');
const SustainabilityMetrics = require('../models/SustainabilityMetrics');
const geminiService = require('./gemini.service');

/**
 * Carbon emission factors (kg CO2e per unit)
 * Based on industry standards and environmental databases
 */
const EMISSION_FACTORS = {
  // Materials (kg CO2e per kg)
  concrete: 0.13,
  steel: 1.85,
  wood: -0.9, // Negative because wood sequesters carbon
  brick: 0.24,
  aluminum: 9.0,
  glass: 0.85,
  plastic: 6.0,
  cement: 0.93,
  sand: 0.01,
  gravel: 0.05,
  
  // Default for unknown materials
  default: 0.5,
  
  // Eco-friendly material bonus (reduction factor)
  eco_friendly: 0.3
};

/**
 * Eco-friendly material types
 */
const ECO_FRIENDLY_MATERIALS = [
  'recycled',
  'sustainable',
  'reclaimed',
  'bamboo',
  'hemp',
  'cork',
  'straw',
  'earth',
  'natural'
];

/**
 * Calculate material sustainability score (0-100)
 * Based on: eco-friendly materials usage, sourcing, certifications
 */
const calculateMaterialScore = async (projectId) => {
  const materials = await Material.find({ projectId });
  
  if (materials.length === 0) {
    return 50; // Neutral score if no materials
  }

  let totalScore = 0;
  let totalWeight = 0;

  materials.forEach(material => {
    const quantity = material.quantity || 0;
    let score = 50; // Base score

    // Check if material is eco-friendly
    const materialName = (material.name || '').toLowerCase();
    const materialType = (material.type || '').toLowerCase();
    const isEcoFriendly = ECO_FRIENDLY_MATERIALS.some(
      eco => materialName.includes(eco) || materialType.includes(eco)
    );

    if (isEcoFriendly) {
      score += 30; // Bonus for eco-friendly materials
    }

    // Check for certifications (if available in material schema)
    if (material.certification) {
      score += 15;
    }

    // Penalize high-emission materials
    if (materialType.includes('plastic') || materialType.includes('aluminum')) {
      score -= 10;
    }

    // Bonus for local sourcing (reduces transport emissions)
    if (material.source === 'local' || material.isLocal) {
      score += 10;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    totalScore += score * quantity;
    totalWeight += quantity;
  });

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
};

/**
 * Calculate waste management score (0-100)
 * Lower waste and higher recycling rate = higher score
 */
const calculateWasteScore = async (projectId) => {
  const materials = await Material.find({ projectId });
  const wasteRecords = await Waste.find({ projectId });

  if (materials.length === 0 || wasteRecords.length === 0) {
    return 70; // Default score if no waste data
  }

  // Calculate total material quantity
  const totalMaterialQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);

  // Calculate total waste quantity
  const totalWasteQuantity = wasteRecords.reduce((sum, w) => sum + (w.quantity || 0), 0);

  // Calculate waste ratio (lower is better)
  const wasteRatio = totalMaterialQuantity > 0 
    ? (totalWasteQuantity / totalMaterialQuantity) * 100 
    : 0;

  // Calculate recycling rate
  const recyclableWaste = wasteRecords.filter(
    w => w.disposalMethod === 'recycling' || w.disposalMethod === 'reuse'
  );
  const recyclableQuantity = recyclableWaste.reduce((sum, w) => sum + w.quantity, 0);
  const recyclingRate = totalWasteQuantity > 0 
    ? (recyclableQuantity / totalWasteQuantity) * 100 
    : 0;

  // Calculate score
  // Lower waste ratio = higher score (max 60 points)
  // Higher recycling rate = higher score (max 40 points)
  let wasteScore = 100 - (wasteRatio * 2); // Penalize waste
  wasteScore = Math.max(0, Math.min(60, wasteScore));

  const recyclingScore = (recyclingRate / 100) * 40;

  const totalScore = wasteScore + recyclingScore;

  return Math.round(Math.max(0, Math.min(100, totalScore)));
};

/**
 * Calculate energy efficiency score (0-100)
 * Based on project duration, efficiency ratings, renewable energy usage
 */
const calculateEnergyScore = async (projectId) => {
  const project = await Project.findById(projectId);
  
  if (!project) {
    return 50; // Neutral score if no project
  }

  let score = 50; // Base score

  // Bonus for efficient project timeline (less energy usage)
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate || Date.now());
  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  
  // Efficient timeline bonus (projects completed faster use less energy)
  if (durationDays < 90) {
    score += 15;
  } else if (durationDays < 180) {
    score += 10;
  }

  // Check for renewable energy usage (if available in project data)
  if (project.renewableEnergy === true) {
    score += 25;
  }

  // Check for energy-efficient equipment
  if (project.energyEfficient === true) {
    score += 15;
  }

  // Bonus for green building certifications
  if (project.certification) {
    const cert = project.certification.toLowerCase();
    if (cert.includes('leed') || cert.includes('breeam') || cert.includes('green')) {
      score += 20;
    }
  }

  return Math.max(0, Math.min(100, score));
};

/**
 * Calculate project sustainability score
 * @param {String} projectId - Project ID
 * @returns {Object} - Sustainability scores and metrics
 */
exports.calculateProjectScore = async (projectId) => {
  try {
    // Calculate component scores in parallel
    const [materialScore, wasteScore, energyScore] = await Promise.all([
      calculateMaterialScore(projectId),
      calculateWasteScore(projectId),
      calculateEnergyScore(projectId)
    ]);

    // Calculate overall score (weighted average)
    // 40% materials, 30% waste, 30% energy
    const overallScore = Math.round(
      (materialScore * 0.4) + (wasteScore * 0.3) + (energyScore * 0.3)
    );

    // Calculate additional metrics
    const materials = await Material.find({ projectId });
    const wasteRecords = await Waste.find({ projectId });

    const totalMaterialQuantity = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const totalWasteQuantity = wasteRecords.reduce((sum, w) => sum + (w.quantity || 0), 0);

    const ecoFriendlyMaterials = materials.filter(m => {
      const name = (m.name || '').toLowerCase();
      const type = (m.type || '').toLowerCase();
      return ECO_FRIENDLY_MATERIALS.some(eco => name.includes(eco) || type.includes(eco));
    });

    const ecoFriendlyPercentage = materials.length > 0
      ? (ecoFriendlyMaterials.length / materials.length) * 100
      : 0;

    const wasteReductionRate = totalMaterialQuantity > 0
      ? ((1 - (totalWasteQuantity / totalMaterialQuantity)) * 100)
      : 100;

    const recyclableWaste = wasteRecords.filter(
      w => w.disposalMethod === 'recycling' || w.disposalMethod === 'reuse'
    );
    const recyclingRate = totalWasteQuantity > 0
      ? (recyclableWaste.reduce((sum, w) => sum + w.quantity, 0) / totalWasteQuantity) * 100
      : 0;

    return {
      overallScore,
      scores: {
        materialScore,
        wasteScore,
        energyScore
      },
      metrics: {
        ecoFriendlyMaterialsPercentage: parseFloat(ecoFriendlyPercentage.toFixed(2)),
        wasteReductionRate: parseFloat(wasteReductionRate.toFixed(2)),
        recyclingRate: parseFloat(recyclingRate.toFixed(2)),
        energyEfficiencyRating: Math.round(energyScore / 10) // Convert to 0-10 scale
      }
    };
  } catch (error) {
    console.error('Error calculating sustainability score:', error);
    throw error;
  }
};

/**
 * Calculate carbon footprint for a project
 * @param {String} projectId - Project ID
 * @returns {Object} - Carbon footprint breakdown
 */
exports.calculateCarbonFootprint = async (projectId) => {
  try {
    const materials = await Material.find({ projectId });
    const wasteRecords = await Waste.find({ projectId });

    let materialEmissions = 0;
    let wasteEmissions = 0;

    // Calculate material emissions
    materials.forEach(material => {
      const materialType = (material.type || 'default').toLowerCase();
      const quantity = material.quantity || 0;
      
      // Find matching emission factor
      let emissionFactor = EMISSION_FACTORS.default;
      for (const [key, value] of Object.entries(EMISSION_FACTORS)) {
        if (materialType.includes(key)) {
          emissionFactor = value;
          break;
        }
      }

      // Check if eco-friendly (reduces emissions)
      const materialName = (material.name || '').toLowerCase();
      const isEcoFriendly = ECO_FRIENDLY_MATERIALS.some(
        eco => materialName.includes(eco) || materialType.includes(eco)
      );

      if (isEcoFriendly) {
        emissionFactor *= EMISSION_FACTORS.eco_friendly;
      }

      materialEmissions += quantity * emissionFactor;
    });

    // Calculate waste disposal emissions
    wasteRecords.forEach(waste => {
      const quantity = waste.quantity || 0;
      let wasteEmissionFactor = 0.1; // Base emission for waste

      // Different disposal methods have different emissions
      switch (waste.disposalMethod) {
        case 'landfill':
          wasteEmissionFactor = 0.5;
          break;
        case 'incineration':
          wasteEmissionFactor = 0.7;
          break;
        case 'recycling':
          wasteEmissionFactor = 0.05;
          break;
        case 'reuse':
          wasteEmissionFactor = 0.01;
          break;
        case 'composting':
          wasteEmissionFactor = 0.02;
          break;
      }

      wasteEmissions += quantity * wasteEmissionFactor;
    });

    // Estimate transport emissions (10% of material emissions)
    const transportEmissions = materialEmissions * 0.1;

    // Estimate energy emissions (15% of material emissions)
    const energyEmissions = materialEmissions * 0.15;

    const totalEmissions = materialEmissions + transportEmissions + wasteEmissions + energyEmissions;

    return {
      total: parseFloat(totalEmissions.toFixed(2)),
      breakdown: {
        materials: parseFloat(materialEmissions.toFixed(2)),
        transport: parseFloat(transportEmissions.toFixed(2)),
        waste: parseFloat(wasteEmissions.toFixed(2)),
        energy: parseFloat(energyEmissions.toFixed(2))
      },
      unit: 'kg CO2e'
    };
  } catch (error) {
    console.error('Error calculating carbon footprint:', error);
    throw error;
  }
};

/**
 * Get AI-powered sustainability recommendations
 * @param {String} projectId - Project ID
 * @returns {Array} - List of recommendations
 */
exports.getRecommendations = async (projectId) => {
  try {
    const project = await Project.findById(projectId);
    const materials = await Material.find({ projectId });
    const wasteRecords = await Waste.find({ projectId });
    const scores = await this.calculateProjectScore(projectId);
    const carbonFootprint = await this.calculateCarbonFootprint(projectId);

    const recommendations = [];

    // Material recommendations
    if (scores.scores.materialScore < 70) {
      recommendations.push({
        category: 'materials',
        priority: 'high',
        title: 'Increase use of eco-friendly materials',
        description: `Currently ${scores.metrics.ecoFriendlyMaterialsPercentage.toFixed(1)}% of materials are eco-friendly. Consider using recycled, reclaimed, or sustainable alternatives.`,
        potentialImpact: 'significant',
        estimatedCO2Reduction: carbonFootprint.breakdown.materials * 0.3,
        implementationDifficulty: 'medium'
      });
    }

    // Waste recommendations
    if (scores.scores.wasteScore < 70) {
      recommendations.push({
        category: 'waste',
        priority: 'high',
        title: 'Improve waste management practices',
        description: `Recycling rate is ${scores.metrics.recyclingRate.toFixed(1)}%. Implement better sorting and recycling processes.`,
        potentialImpact: 'moderate',
        estimatedCO2Reduction: carbonFootprint.breakdown.waste * 0.5,
        implementationDifficulty: 'easy'
      });
    }

    // Energy recommendations
    if (scores.scores.energyScore < 70) {
      recommendations.push({
        category: 'energy',
        priority: 'medium',
        title: 'Optimize energy efficiency',
        description: 'Consider using energy-efficient equipment and renewable energy sources.',
        potentialImpact: 'moderate',
        estimatedCO2Reduction: carbonFootprint.breakdown.energy * 0.4,
        implementationDifficulty: 'medium'
      });
    }

    // Use AI for advanced recommendations (if scores are available)
    if (scores.overallScore < 80) {
      try {
        const aiPrompt = `Based on the following construction project data:
- Overall Sustainability Score: ${scores.overallScore}/100
- Material Score: ${scores.scores.materialScore}/100
- Waste Score: ${scores.scores.wasteScore}/100
- Energy Score: ${scores.scores.energyScore}/100
- Carbon Footprint: ${carbonFootprint.total} kg CO2e
- Eco-friendly Materials: ${scores.metrics.ecoFriendlyMaterialsPercentage}%
- Recycling Rate: ${scores.metrics.recyclingRate}%

Provide 2-3 specific, actionable recommendations to improve sustainability. Format as JSON array with: category, priority, title, description, estimatedCO2Reduction (number).`;

        const aiRecommendations = await geminiService.generateText(aiPrompt);
        
        // Try to parse AI response as JSON
        try {
          const parsedAI = JSON.parse(aiRecommendations);
          if (Array.isArray(parsedAI)) {
            parsedAI.forEach(rec => {
              recommendations.push({
                ...rec,
                potentialImpact: 'moderate',
                implementationDifficulty: 'medium'
              });
            });
          }
        } catch (e) {
          // If not JSON, add as general recommendation
          recommendations.push({
            category: 'general',
            priority: 'medium',
            title: 'AI-generated recommendations',
            description: aiRecommendations,
            potentialImpact: 'moderate',
            implementationDifficulty: 'medium'
          });
        }
      } catch (aiError) {
        console.error('AI recommendation generation failed:', aiError);
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw error;
  }
};

/**
 * Compare project to industry benchmarks
 * @param {String} projectId - Project ID
 * @returns {Object} - Benchmark comparison
 */
exports.compareToBenchmark = async (projectId) => {
  try {
    const scores = await this.calculateProjectScore(projectId);
    const overallScore = scores.overallScore;

    // Industry average (based on research - typical construction project)
    const industryAverage = 65;

    // Determine rank
    let rank = 'average';
    let percentile = 50;

    if (overallScore >= 85) {
      rank = 'excellent';
      percentile = 90;
    } else if (overallScore >= 75) {
      rank = 'good';
      percentile = 75;
    } else if (overallScore >= 60) {
      rank = 'average';
      percentile = 50;
    } else if (overallScore >= 45) {
      rank = 'below_average';
      percentile = 25;
    } else {
      rank = 'poor';
      percentile = 10;
    }

    return {
      projectScore: overallScore,
      industryAverage,
      rank,
      percentile,
      difference: overallScore - industryAverage,
      performanceSummary: overallScore > industryAverage 
        ? `Your project is performing ${(overallScore - industryAverage).toFixed(1)} points above industry average.`
        : `Your project is ${(industryAverage - overallScore).toFixed(1)} points below industry average.`
    };
  } catch (error) {
    console.error('Error comparing to benchmark:', error);
    throw error;
  }
};

/**
 * Save sustainability metrics to database
 * @param {String} projectId - Project ID
 * @returns {Object} - Saved metrics
 */
exports.saveSustainabilityMetrics = async (projectId) => {
  try {
    const scores = await this.calculateProjectScore(projectId);
    const carbonFootprint = await this.calculateCarbonFootprint(projectId);
    const benchmark = await this.compareToBenchmark(projectId);
    const recommendations = await this.getRecommendations(projectId);

    const metrics = await SustainabilityMetrics.create({
      projectId,
      overallScore: scores.overallScore,
      scores: scores.scores,
      carbonFootprint,
      metrics: scores.metrics,
      recommendations,
      benchmark,
      calculatedBy: 'system'
    });

    // Update project sustainability score
    await Project.findByIdAndUpdate(projectId, {
      sustainabilityScore: scores.overallScore
    });

    return metrics;
  } catch (error) {
    console.error('Error saving sustainability metrics:', error);
    throw error;
  }
};


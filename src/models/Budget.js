const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['materials', 'labor', 'equipment', 'other']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  invoiceNumber: String,
  vendor: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  paymentDate: Date,
  addedBy: String
});

const costPredictionSchema = new mongoose.Schema({
  materialType: String,
  currentPrice: Number,
  predictedPrice: Number,
  predictionDate: {
    type: Date,
    default: Date.now
  },
  confidence: Number,
  marketTrend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable']
  }
});

const budgetSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: 0
  },
  allocations: {
    materials: {
      type: Number,
      default: 0,
      min: 0
    },
    labor: {
      type: Number,
      default: 0,
      min: 0
    },
    equipment: {
      type: Number,
      default: 0,
      min: 0
    },
    other: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  expenses: [expenseSchema],
  costPredictions: [costPredictionSchema],
  contingencyPercentage: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  currency: {
    type: String,
    default: 'LKR'
  }
}, {
  timestamps: true
});

// Calculate total expenses
budgetSchema.virtual('totalExpenses').get(function() {
  return this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
});

// Calculate remaining budget
budgetSchema.virtual('remainingBudget').get(function() {
  return this.totalBudget - this.totalExpenses;
});

// Calculate budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  return this.totalBudget > 0 ? (this.totalExpenses / this.totalBudget) * 100 : 0;
});

// Calculate expenses by category
budgetSchema.virtual('expensesByCategory').get(function() {
  const categories = {
    materials: 0,
    labor: 0,
    equipment: 0,
    other: 0
  };

  this.expenses.forEach(expense => {
    categories[expense.category] += expense.amount;
  });

  return categories;
});

// Enable virtuals in JSON
budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

// Check if budget is exceeded
budgetSchema.methods.isBudgetExceeded = function() {
  return this.totalExpenses > this.totalBudget;
};

// Get budget alert level
budgetSchema.methods.getBudgetAlertLevel = function() {
  const utilization = this.utilizationPercentage;
  
  if (utilization >= 100) return 'critical';
  if (utilization >= 90) return 'high';
  if (utilization >= 75) return 'medium';
  return 'low';
};

module.exports = mongoose.model('Budget', budgetSchema);


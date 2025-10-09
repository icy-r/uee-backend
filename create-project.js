/**
 * Quick script to create a project in MongoDB
 * Run: node create-project.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Project Schema (same as in src/models/Project.js)
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  expectedEndDate: { type: Date, required: true },
  actualEndDate: Date,
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
  sustainabilityScore: { type: Number, min: 0, max: 100, default: 0 },
  teamSize: { type: Number, default: 0 },
  projectType: {
    type: String,
    required: true,
    enum: ['residential', 'commercial', 'industrial', 'infrastructure']
  },
  projectSize: {
    value: Number,
    unit: { type: String, enum: ['sqft', 'sqm', 'acres'] }
  },
  owner: { type: String, required: true },
  createdBy: { type: String, required: true }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);

async function createProject() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Sample project data - CUSTOMIZE THIS!
    const projectData = {
      name: 'Green Valley Residential Complex',
      description: 'Sustainable residential construction project with eco-friendly materials and green building practices',
      location: 'Colombo, Sri Lanka',
      startDate: new Date('2024-01-15'),
      expectedEndDate: new Date('2025-06-30'),
      status: 'in_progress',
      progressPercentage: 0,
      sustainabilityScore: 0,
      teamSize: 25,
      projectType: 'residential',
      projectSize: {
        value: 5000,
        unit: 'sqft'
      },
      owner: 'admin@construction.com',
      createdBy: 'admin@construction.com'
    };

    // Create project
    const project = await Project.create(projectData);

    console.log('🎉 Project created successfully!\n');
    console.log('📋 Project Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', project._id.toString());
    console.log('Name:', project.name);
    console.log('Type:', project.projectType);
    console.log('Location:', project.location);
    console.log('Status:', project.status);
    console.log('Start Date:', project.startDate.toDateString());
    console.log('Expected End:', project.expectedEndDate.toDateString());
    console.log('Team Size:', project.teamSize);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('💡 Use this Project ID in your API calls:');
    console.log(`   projectId=${project._id.toString()}\n`);

    console.log('📝 Example API calls:');
    console.log(`   curl "http://localhost:5000/api/dashboard/overview?projectId=${project._id}"`);
    console.log(`   curl "http://localhost:5000/api/materials?projectId=${project._id}"\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  }
}

// Run the function
createProject();


#!/usr/bin/env node
/**
 * Cleanup Script - Remove records without isDeleted field
 * 
 * This script removes records from MongoDB that don't have the isDeleted field.
 * This is useful for cleaning up old records created before soft delete was implemented.
 * 
 * Usage:
 *   node migrations/cleanup-deleted-records.js [--dry-run] [--collection=<name>]
 * 
 * Options:
 *   --dry-run          Show what would be deleted without actually deleting
 *   --collection=<name> Only clean specific collection (e.g., users, projects)
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import all models
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Material = require('../src/models/Material');
const Task = require('../src/models/Task');
const Budget = require('../src/models/Budget');
const Document = require('../src/models/Document');
const Waste = require('../src/models/Waste');
const Notification = require('../src/models/Notification');

// Model mapping
const MODELS = {
  users: User,
  projects: Project,
  materials: Material,
  tasks: Task,
  budgets: Budget,
  documents: Document,
  wastes: Waste,
  notifications: Notification
};

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sustainable-construction');
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Clean up records without isDeleted field for a specific model
 */
async function cleanupModel(modelName, Model, dryRun = false) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Cleaning ${modelName}...`);
  console.log('='.repeat(60));

  try {
    // Find records without isDeleted field
    const recordsWithoutField = await Model.find({
      isDeleted: { $exists: false }
    }).lean();

    console.log(`Found ${recordsWithoutField.length} records without isDeleted field`);

    if (recordsWithoutField.length === 0) {
      console.log('✓ No cleanup needed');
      return { deleted: 0, errors: 0 };
    }

    if (dryRun) {
      console.log('\n[DRY RUN] Would delete the following records:');
      recordsWithoutField.slice(0, 5).forEach((record, i) => {
        console.log(`  ${i + 1}. ID: ${record._id}, Created: ${record.createdAt || 'N/A'}`);
        if (record.email) console.log(`     Email: ${record.email}`);
        if (record.name) console.log(`     Name: ${record.name}`);
      });
      if (recordsWithoutField.length > 5) {
        console.log(`  ... and ${recordsWithoutField.length - 5} more`);
      }
      return { deleted: recordsWithoutField.length, errors: 0 };
    }

    // Delete records
    const ids = recordsWithoutField.map(r => r._id);
    const result = await Model.deleteMany({ _id: { $in: ids } });

    console.log(`✓ Deleted ${result.deletedCount} records`);
    return { deleted: result.deletedCount, errors: 0 };

  } catch (error) {
    console.error(`❌ Error cleaning ${modelName}:`, error.message);
    return { deleted: 0, errors: 1 };
  }
}

/**
 * Main cleanup function
 */
async function cleanup(options = {}) {
  const { dryRun = false, collection = null } = options;

  console.log('\n🧹 MongoDB Cleanup - Remove Records Without isDeleted Field');
  console.log('===========================================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Collection: ${collection || 'ALL'}`);
  console.log('===========================================================\n');

  try {
    await connectDB();

    const stats = {
      totalDeleted: 0,
      totalErrors: 0,
      details: {}
    };

    // Determine which models to clean
    const modelsToClean = collection
      ? { [collection]: MODELS[collection] }
      : MODELS;

    if (collection && !MODELS[collection]) {
      console.error(`❌ Unknown collection: ${collection}`);
      console.log(`Available collections: ${Object.keys(MODELS).join(', ')}`);
      process.exit(1);
    }

    // Clean each model
    for (const [modelName, Model] of Object.entries(modelsToClean)) {
      const result = await cleanupModel(modelName, Model, dryRun);
      stats.totalDeleted += result.deleted;
      stats.totalErrors += result.errors;
      stats.details[modelName] = result;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total records ${dryRun ? 'that would be' : ''} deleted: ${stats.totalDeleted}`);
    console.log(`Total errors: ${stats.totalErrors}`);
    console.log('\nDetails by collection:');
    Object.entries(stats.details).forEach(([model, result]) => {
      console.log(`  ${model}: ${result.deleted} deleted, ${result.errors} errors`);
    });
    console.log('='.repeat(60));

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('Remove --dry-run flag to perform actual cleanup.');
    } else {
      console.log('\n✓ Cleanup completed successfully!');
    }

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ MongoDB connection closed\n');
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  collection: args.find(arg => arg.startsWith('--collection='))?.split('=')[1] || null
};

// Run cleanup
cleanup(options);


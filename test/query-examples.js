/**
 * Query System Examples and Tests
 * 
 * This file contains example queries that can be used to test
 * the OData-like query system.
 * 
 * To run these examples:
 * 1. Start the backend server: npm run dev
 * 2. Use curl, Postman, or any HTTP client
 * 3. Ensure you have test data in the database
 */

// Base URL for development
const BASE_URL = 'http://localhost:5000/api';

// Example Project ID (replace with actual ID from your database)
const PROJECT_ID = '670e9e9b3c6d8f001234abcd';

/**
 * MATERIALS API EXAMPLES
 */

const materialExamples = {
  // Basic filtering
  getAllMaterials: `${BASE_URL}/materials?projectId=${PROJECT_ID}`,
  
  // Filter by category
  getCementMaterials: `${BASE_URL}/materials?projectId=${PROJECT_ID}&category=cement`,
  
  // Numeric comparison - quantity greater than 100
  getHighQuantityMaterials: `${BASE_URL}/materials?projectId=${PROJECT_ID}&quantity[gt]=100`,
  
  // Numeric range - quantity between 50 and 200
  getMaterialsInRange: `${BASE_URL}/materials?projectId=${PROJECT_ID}&quantity[gte]=50&quantity[lte]=200`,
  
  // String contains (case-insensitive)
  searchByName: `${BASE_URL}/materials?projectId=${PROJECT_ID}&name[contains]=steel`,
  
  // Boolean filter
  getEcoFriendlyMaterials: `${BASE_URL}/materials?projectId=${PROJECT_ID}&ecoFriendly=true`,
  
  // Multiple categories using IN operator
  getMultipleCategories: `${BASE_URL}/materials?projectId=${PROJECT_ID}&category[in]=cement,steel,wood`,
  
  // Exclude categories using NIN operator
  excludeCategories: `${BASE_URL}/materials?projectId=${PROJECT_ID}&category[nin]=sand,gravel`,
  
  // Complex filter: eco-friendly cement with quantity > 100
  complexFilter: `${BASE_URL}/materials?projectId=${PROJECT_ID}&category=cement&ecoFriendly=true&quantity[gt]=100`,
  
  // Sorting - ascending by name
  sortByNameAsc: `${BASE_URL}/materials?projectId=${PROJECT_ID}&sort=name:asc`,
  
  // Sorting - descending by quantity
  sortByQuantityDesc: `${BASE_URL}/materials?projectId=${PROJECT_ID}&sort=quantity:desc`,
  
  // Multiple sort fields
  multipleSort: `${BASE_URL}/materials?projectId=${PROJECT_ID}&sort=category:asc,quantity:desc`,
  
  // Field selection - only return specific fields
  selectFields: `${BASE_URL}/materials?projectId=${PROJECT_ID}&select=name,quantity,unit,category`,
  
  // Pagination - page 2 with 20 items per page
  pagination: `${BASE_URL}/materials?projectId=${PROJECT_ID}&page=2&limit=20`,
  
  // Complete example: complex filter + sort + pagination + field selection
  fullExample: `${BASE_URL}/materials?projectId=${PROJECT_ID}&category[in]=cement,steel&quantity[gte]=50&ecoFriendly=true&sort=quantity:desc,name:asc&page=1&limit=20&select=name,quantity,unit,category,ecoFriendly`
};

/**
 * TASKS API EXAMPLES
 */

const taskExamples = {
  // All tasks
  getAllTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}`,
  
  // Filter by status
  getInProgressTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&status=in_progress`,
  
  // Filter by priority
  getHighPriorityTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&priority=high`,
  
  // Date comparison - tasks with deadline before specific date
  getOverdueTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&deadline[lt]=2025-10-10`,
  
  // Date range - tasks with deadline in next 7 days
  getUpcomingTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&deadline[gte]=2025-10-10&deadline[lte]=2025-10-17`,
  
  // Tasks assigned to specific workers
  getWorkerTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&assignedTo[in]=worker1@email.com,worker2@email.com`,
  
  // Search by title
  searchTaskTitle: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&title[contains]=foundation`,
  
  // Complex filter: high priority, in progress, due this month
  urgentTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&priority=high&status=in_progress&deadline[lte]=2025-10-31`,
  
  // Sort by deadline
  sortByDeadline: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&sort=deadline:asc`,
  
  // Completed tasks sorted by completion date
  recentlyCompleted: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&status=completed&sort=completedAt:desc`,
  
  // Tasks not started yet
  notStartedTasks: `${BASE_URL}/tasks?projectId=${PROJECT_ID}&status=not_started&sort=priority:desc,deadline:asc`
};

/**
 * PROJECTS API EXAMPLES
 */

const projectExamples = {
  // All projects
  getAllProjects: `${BASE_URL}/projects`,
  
  // Active projects
  getActiveProjects: `${BASE_URL}/projects?status=in_progress`,
  
  // Projects with high sustainability score
  getSustainableProjects: `${BASE_URL}/projects?sustainabilityScore[gte]=70`,
  
  // Projects by type
  getResidentialProjects: `${BASE_URL}/projects?projectType[in]=residential,commercial`,
  
  // Projects starting after a date
  getFutureProjects: `${BASE_URL}/projects?startDate[gte]=2025-01-01`,
  
  // Projects with progress > 50%
  getProgressingProjects: `${BASE_URL}/projects?progressPercentage[gt]=50`,
  
  // Search by location
  getProjectsByLocation: `${BASE_URL}/projects?location[contains]=New York`,
  
  // Search by name
  searchProjects: `${BASE_URL}/projects?name[contains]=construction`,
  
  // Sort by progress
  sortByProgress: `${BASE_URL}/projects?status=in_progress&sort=progressPercentage:desc`,
  
  // Sort by sustainability score
  sortBySustainability: `${BASE_URL}/projects?sort=sustainabilityScore:desc`,
  
  // Complex filter: active residential projects with good sustainability
  filteredProjects: `${BASE_URL}/projects?status=in_progress&projectType=residential&sustainabilityScore[gte]=60&sort=startDate:desc`
};

/**
 * DOCUMENTS API EXAMPLES
 */

const documentExamples = {
  // All documents
  getAllDocuments: `${BASE_URL}/documents?projectId=${PROJECT_ID}`,
  
  // Filter by category
  getPlans: `${BASE_URL}/documents?projectId=${PROJECT_ID}&category=plan`,
  
  // Processed documents only
  getProcessedDocuments: `${BASE_URL}/documents?projectId=${PROJECT_ID}&isProcessed=true`,
  
  // Documents uploaded this month
  getRecentDocuments: `${BASE_URL}/documents?projectId=${PROJECT_ID}&createdAt[gte]=2025-10-01`,
  
  // Image documents
  getImageDocuments: `${BASE_URL}/documents?projectId=${PROJECT_ID}&fileType[contains]=image`,
  
  // Large documents (> 1MB)
  getLargeDocuments: `${BASE_URL}/documents?projectId=${PROJECT_ID}&fileSize[gt]=1048576`,
  
  // Search by filename
  searchDocuments: `${BASE_URL}/documents?projectId=${PROJECT_ID}&filename[contains]=report`,
  
  // Multiple categories
  getImportantDocs: `${BASE_URL}/documents?projectId=${PROJECT_ID}&category[in]=plan,permit,contract`,
  
  // Sort by upload date
  sortByDate: `${BASE_URL}/documents?projectId=${PROJECT_ID}&sort=createdAt:desc`,
  
  // Sort by file size
  sortBySize: `${BASE_URL}/documents?projectId=${PROJECT_ID}&sort=fileSize:desc`,
  
  // Select specific fields
  getDocumentList: `${BASE_URL}/documents?projectId=${PROJECT_ID}&select=filename,category,fileSize,createdAt`
};

/**
 * CURL COMMANDS FOR TESTING
 */

const curlExamples = {
  // Get materials with quantity > 100
  getMaterials: `curl "${BASE_URL}/materials?projectId=${PROJECT_ID}&quantity[gt]=100"`,
  
  // Get high priority tasks
  getTasks: `curl "${BASE_URL}/tasks?projectId=${PROJECT_ID}&priority=high&status=in_progress"`,
  
  // Get active projects
  getProjects: `curl "${BASE_URL}/projects?status=in_progress&sort=progressPercentage:desc"`,
  
  // Get recent documents
  getDocuments: `curl "${BASE_URL}/documents?projectId=${PROJECT_ID}&createdAt[gte]=2025-10-01&sort=createdAt:desc"`
};

/**
 * POSTMAN COLLECTION EXAMPLES
 */

const postmanCollection = {
  info: {
    name: 'Query System Examples',
    description: 'OData-like query system test collection',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
  },
  variable: [
    {
      key: 'baseUrl',
      value: BASE_URL,
      type: 'string'
    },
    {
      key: 'projectId',
      value: PROJECT_ID,
      type: 'string'
    }
  ],
  item: [
    {
      name: 'Materials',
      item: [
        {
          name: 'Get All Materials',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/materials?projectId={{projectId}}'
          }
        },
        {
          name: 'Filter by Quantity',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/materials?projectId={{projectId}}&quantity[gt]=100'
          }
        },
        {
          name: 'Search by Name',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/materials?projectId={{projectId}}&name[contains]=steel'
          }
        },
        {
          name: 'Complex Filter',
          request: {
            method: 'GET',
            url: '{{baseUrl}}/materials?projectId={{projectId}}&category[in]=cement,steel&quantity[gte]=50&ecoFriendly=true&sort=quantity:desc'
          }
        }
      ]
    }
  ]
};

// Export for use in tests
module.exports = {
  materialExamples,
  taskExamples,
  projectExamples,
  documentExamples,
  curlExamples,
  postmanCollection
};

/**
 * USAGE EXAMPLES
 * 
 * 1. Copy any URL from the examples above
 * 2. Replace PROJECT_ID with your actual project ID
 * 3. Use in browser, Postman, curl, or your FlutterFlow app
 * 
 * Example with curl:
 *   curl "http://localhost:5000/api/materials?projectId=YOUR_ID&quantity[gt]=100"
 * 
 * Example in JavaScript/Flutter:
 *   fetch('http://localhost:5000/api/materials?projectId=123&quantity[gt]=100')
 *     .then(res => res.json())
 *     .then(data => console.log(data));
 */


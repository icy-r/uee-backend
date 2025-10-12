# FlutterFlow User Flows for Sustainable Construction MVP

## Overview
User flows designed to integrate with existing uee-backend APIs (MongoDB + optional auth). Each flow includes: screens, user actions, API endpoints, and data requirements.

## 1. Authentication & Onboarding

### Flow: User Login
**Screens:** Login Screen → Dashboard

**User Actions:**
1. Open app → Login screen appears
2. Enter email and password
3. Tap "Login" button
4. Navigate to Dashboard on success

**FlutterFlow Setup:**
- Use FlutterFlow's built-in authentication system
- Enable Email/Password authentication in FlutterFlow Auth settings
- Create login form with email/password fields
- Set up authenticated user state management
- Configure initial page as Dashboard (after authentication)

**Backend Integration:**
- Backend uses optional authentication (already configured with optionalAuth middleware)
- No need to pass auth tokens to backend APIs for MVP
- User email can be stored in app state for display purposes

## 2. Common Dashboard

### Flow: View Dashboard Overview
**Screens:** Dashboard Home

**Components to Display:**
- Project status card (name, progress %, status)
- Sustainability score with visual indicator (0-100)
- Quick stats (tasks, budget utilization, materials)
- Weather widget for project location
- Navigation cards to 4 main sections
- Progress chart (basic line/bar chart)

**API Calls:**
1. `GET /api/dashboard/overview?projectId={id}`
   - Returns: project status, progressPercentage, sustainabilityScore, task counts, budget summary

2. `GET /api/dashboard/analytics?projectId={id}`
   - Returns: completion trends, task completion over time

3. `GET /api/dashboard/weather?projectId={id}`
   - Returns: current weather, forecast, construction impact alerts

4. `GET /api/dashboard/sustainability-score?projectId={id}`
   - Returns: score breakdown, eco-friendly materials %, waste reduction %, AI recommendations

**FlutterFlow Implementation:**
- Create Dashboard page as initial authenticated route
- Add 4 API calls on page load
- Use ListView/GridView for navigation cards
- Add Chart widget for analytics
- Display weather icon based on conditions
- Color-code sustainability score (red <40, yellow 40-70, green >70)

**User Actions:**
- View overview (automatic on load)
- Tap navigation cards → Navigate to respective sections
- Refresh data (pull-to-refresh gesture)

## 3. Material & Resource Management

### Flow 3.1: View Material Inventory
**Screens:** Materials List Screen

**Display:**
- List of all materials with cards showing:
  - Material name, category icon
  - Current inventory quantity + unit
  - Eco-friendly badge (if applicable)
  - Total cost, usage, waste percentages
  - Reorder alert (if needed)

**API Call:**
- `GET /api/materials?projectId={id}`

**FlutterFlow Setup:**
- Create ListView with material cards
- Use conditional visibility for eco-friendly badge
- Show alert icon if needsReorder = true

### Flow 3.2: Add New Material
**Screens:** Materials List → Add Material Form → Materials List

**User Actions:**
1. Tap "+" button on Materials List
2. Fill form:
   - Name (text)
   - Category (dropdown: cement, steel, wood, bricks, sand, gravel, paint, electrical, plumbing, other)
   - Quantity (number)
   - Unit (dropdown: kg, ton, liter, piece, sqft, sqm, cubic_meter, bag)
   - Unit Cost (number)
   - Supplier (text, optional)
   - Eco-friendly (toggle switch)
   - Reorder level (number, optional)
3. Tap "Save"
4. Navigate back to list with new material added

**API Call:**
- `POST /api/materials`
- Body: `{ projectId, name, category, quantity, unit, unitCost, supplier, ecoFriendly, reorderLevel }`

### Flow 3.3: Log Material Usage
**Screens:** Materials List → Material Details → Log Usage Form

**User Actions:**
1. Tap material card → Material Details screen
2. Tap "Log Usage" button
3. Fill form:
   - Quantity used (number)
   - Used for (text: task/purpose)
   - Notes (optional)
4. Tap "Submit"
5. Updated inventory shown

**API Call:**
- `POST /api/materials/{materialId}/usage`
- Body: `{ quantity, usedFor, notes }`

### Flow 3.4: Log Waste
**Screens:** Material Details → Log Waste Form

**User Actions:**
1. From Material Details, tap "Log Waste"
2. Fill form:
   - Quantity wasted (number)
   - Reason (text)
   - Notes (optional)
3. Tap "Submit"
4. Waste log updated, sustainability score recalculated

**API Call:**
- `POST /api/materials/{materialId}/waste`
- Body: `{ quantity, reason, notes }`

### Flow 3.5: AI Material Estimation
**Screens:** Materials List → AI Estimation Screen → Results

**User Actions:**
1. Tap "AI Estimate" button
2. View/confirm project details (auto-filled from project):
   - Project size
   - Project type
   - Duration
3. Tap "Generate Estimate"
4. View AI-predicted material quantities:
   - Material type, predicted quantity, confidence level
   - "Add to Inventory" option for each material

**API Call:**
- `POST /api/materials/estimate`
- Body: `{ projectId, projectSize, projectType, duration }`
- Returns: `[{ material, category, estimatedQuantity, unit, confidence }]`

### Flow 3.6: Sustainability Metrics
**Screens:** Materials List → Sustainability Dashboard

**Display:**
- Overall score (large number with color)
- Breakdown:
  - Eco-friendly materials: X% (60% weight)
  - Waste reduction: Y% (40% weight)
- AI Recommendations list
- Charts: eco-friendly vs regular materials, waste trends

**API Call:**
- `GET /api/dashboard/sustainability-score?projectId={id}`

## 4. Task Assignment & Progress Monitoring

### Flow 4.1: View Tasks
**Screens:** Tasks List Screen (with tabs/filters)

**Display Tabs:**
- All Tasks
- Not Started
- In Progress
- Completed

**Task Card Shows:**
- Title, description snippet
- Status badge (color-coded)
- Priority indicator (low/medium/high)
- Deadline date (red if overdue)
- Assigned workers (avatars)
- Total hours logged
- Photo count badge

**API Call:**
- `GET /api/tasks?projectId={id}&status={status}`

### Flow 4.2: Create New Task
**Screens:** Tasks List → Create Task Form → Tasks List

**User Actions:**
1. Tap "+" button
2. Fill form:
   - Title (text, required)
   - Description (multiline text, required)
   - Priority (dropdown: low, medium, high)
   - Deadline (date picker)
   - Assign workers (multi-select from list)
   - Notes (optional)
3. Tap "Create Task"
4. Task appears in list

**API Call:**
- `POST /api/tasks`
- Body: `{ projectId, title, description, priority, deadline, assignedTo[], notes }`

### Flow 4.3: Update Task Status (Worker View)
**Screens:** Tasks List → Task Details → Update Status

**User Actions:**
1. Worker taps assigned task
2. Views task details
3. Taps status dropdown
4. Selects new status (not_started → in_progress → completed)
5. Status updates, project progress recalculates

**API Call:**
- `PATCH /api/tasks/{taskId}/status`
- Body: `{ status: "in_progress" }`

### Flow 4.4: Add Photo to Task
**Screens:** Task Details → Camera/Gallery → Photo Preview → Task Details

**User Actions:**
1. From Task Details, tap "Add Photo"
2. Choose camera or gallery
3. Take/select photo
4. Add optional caption
5. Tap "Upload"
6. Photo appears in task's photo gallery

**API Call:**
- `POST /api/tasks/{taskId}/photos`
- Body: FormData with photo file + caption

### Flow 4.5: Log Time
**Screens:** Task Details → Log Time Form

**User Actions:**
1. Tap "Log Time" button
2. Fill form:
   - Hours worked (number)
   - Description of work (text)
   - Date (defaults to today)
3. Tap "Submit"
4. Time log added, total hours updated

**API Call:**
- `POST /api/tasks/{taskId}/time-logs`
- Body: `{ hours, description, date }`

### Flow 4.6: View Task Photos & Time Logs
**Screens:** Task Details (with tabs)

**Tabs:**
1. **Details:** Full description, status, priority, deadline, workers
2. **Photos:** Grid view of all photos with captions
3. **Time Logs:** List of logged hours with descriptions and dates (shows total)

**API Calls:**
- Task details already loaded from list
- Photos and timeLogs included in task object

## 5. Finance & Budget Management

### Flow 5.1: View Budget Overview
**Screens:** Budget Dashboard

**Display:**
- Total Budget (large number)
- Total Expenses (color-coded based on utilization)
- Remaining Budget
- Utilization Percentage (progress bar)
- Budget Alert Level (low/medium/high/critical badge)
- Allocations breakdown (pie chart):
  - Materials
  - Labor
  - Equipment
  - Other
- Expenses by category (bar chart)

**API Call:**
- `GET /api/budget?projectId={id}`

### Flow 5.2: Set/Update Budget
**Screens:** Budget Dashboard → Set Budget Form

**User Actions:**
1. If no budget exists, tap "Set Budget"
2. If budget exists, tap "Edit Budget"
3. Fill form:
   - Total Budget (number, required)
   - Allocations (optional):
     - Materials allocation
     - Labor allocation
     - Equipment allocation
     - Other allocation
   - Contingency % (slider, 0-50%, default 10%)
4. Tap "Save"
5. Budget overview updates

**API Calls:**
- `POST /api/budget` (if creating)
- `PUT /api/budget/{budgetId}` (if updating)
- Body: `{ projectId, totalBudget, allocations, contingencyPercentage }`

### Flow 5.3: Log Expense
**Screens:** Budget Dashboard → Add Expense Form

**User Actions:**
1. Tap "Add Expense" button
2. Fill form:
   - Category (dropdown: materials, labor, equipment, other)
   - Amount (number, required)
   - Description (text, required)
   - Vendor (text, optional)
   - Invoice Number (text, optional)
   - Payment Status (dropdown: pending, paid, overdue)
   - Date (date picker, defaults to today)
3. Tap "Save"
4. Expense added, totals recalculate

**API Call:**
- `POST /api/budget/{budgetId}/expenses`
- Body: `{ category, amount, description, vendor, invoiceNumber, paymentStatus, date }`

### Flow 5.4: View Expense List
**Screens:** Budget Dashboard → Expenses List (with filters)

**Display:**
- List of expenses with cards showing:
  - Category icon
  - Description
  - Amount (formatted currency)
  - Date
  - Payment status badge
  - Vendor name
- Filters: By category, by payment status, by date range
- Sort: Date, amount

**API Call:**
- `GET /api/budget/{budgetId}/expenses?category={cat}&status={status}`

### Flow 5.5: AI Cost Prediction
**Screens:** Budget Dashboard → Cost Predictions Screen

**Display:**
- Current material prices list
- Predicted prices for next 3-6 months
- Market trend indicators (increasing/decreasing/stable)
- Confidence levels
- Visual trend charts
- AI recommendations for bulk purchases

**API Call:**
- `POST /api/budget/predict-costs`
- Body: `{ projectId, materialTypes[], timeframe: "3-months" }`
- Returns: `{ predictions: [{ materialType, currentPrice, predictedPrice, trend, confidence }] }`

**User Actions:**
1. Tap "Cost Predictions" from Budget Dashboard
2. View predictions automatically generated
3. Tap "Refresh" to get updated predictions
4. Tap material to see detailed trend chart

### Flow 5.6: Generate Budget Report
**Screens:** Budget Dashboard → Reports Screen

**Display:**
- Total budget vs actual spending comparison
- Category-wise breakdown (table format)
- Top expenses list
- Payment status summary
- Variance analysis
- Export options (PDF/CSV)

**API Call:**
- `GET /api/budget/{budgetId}/report`

## 6. Document Management

### Flow 6.1: View Documents
**Screens:** Documents List (with category tabs)

**Category Tabs:**
- All
- Plans
- Permits
- Contracts
- Invoices
- Reports
- Photos
- Other

**Document Card Shows:**
- File icon (based on type)
- Filename
- Category badge
- File size
- Upload date
- Uploaded by
- Processing status (if applicable)
- Tags
- Actions: View, Download, Delete

**API Call:**
- `GET /api/documents?projectId={id}&category={cat}`

### Flow 6.2: Upload Document
**Screens:** Documents List → Upload Form → Processing → Documents List

**User Actions:**
1. Tap "Upload" button
2. Choose file source (camera, gallery, file manager)
3. Select file(s)
4. Fill metadata:
   - Category (dropdown)
   - Description (optional)
   - Tags (multi-input)
5. Tap "Upload"
6. Progress indicator shows upload
7. Document appears in list with "processing" status

**API Call:**
- `POST /api/documents`
- Body: FormData with file + `{ projectId, category, description, tags[] }`

### Flow 6.3: View Document Details
**Screens:** Documents List → Document Details

**Display:**
- File preview (if image/PDF)
- Full filename
- Category, size, upload date
- Description
- Tags
- Uploaded by
- Extracted text (if processed)
- Generated tasks (if any)
- Actions: Download, Share, Delete

**API Calls:**
- Document data already loaded from list
- For file preview: Direct file URL from server

### Flow 6.4: Image to Text Extraction
**Screens:** Document Details → Processing → Text Results

**User Actions:**
1. Upload image document (auto-triggers)
2. Processing status shows "processing"
3. n8n webhook processes image via Gemini API
4. Extracted text appears in document details
5. User can copy text or create task from it

**API Flow:**
- Upload triggers: `POST /api/documents/extract-text/{docId}`
- Backend calls n8n webhook
- Webhook status: `GET /api/documents/{docId}` (check processingStatus)
- Result: extractedText field populated

**FlutterFlow Implementation:**
- Show loading indicator during processing
- Poll document status every 3-5 seconds until completed
- Display extracted text in expandable section

### Flow 6.5: Generate Task from Document
**Screens:** Document Details → Generate Task Form → Task Created

**User Actions:**
1. From document with extracted text, tap "Create Task"
2. Pre-filled form shows:
   - Title (editable, from filename)
   - Description (editable, from extracted text or user input)
   - Deadline (date picker)
   - Assign workers (multi-select)
3. Edit as needed
4. Tap "Generate Task"
5. Task created, linked to document
6. Success message, option to view task

**API Call:**
- `POST /api/documents/{docId}/generate-task`
- Body: `{ title, description, deadline, assignedTo[] }`
- Returns: `{ taskId, taskTitle, status: "created" }`

### Flow 6.6: Download Document
**Screens:** Document Details → Download → Success

**User Actions:**
1. Tap "Download" button
2. File downloads to device
3. Success notification
4. Option to open file

**Implementation:**
- Use document's filePath from API
- FlutterFlow: Use download/file_picker package
- URL: `GET /api/documents/{docId}/download`

## 7. Global Features & Navigation

### Bottom Navigation Bar (Main Tabs)
1. Dashboard (home icon)
2. Materials (inventory icon)
3. Tasks (checklist icon)
4. Budget (dollar icon)
5. Documents (folder icon)

### App Bar Actions (Context-Dependent)
- Refresh button (all lists)
- Filter/Sort button (lists)
- Add button (create new item)
- Search button (search within section)

### Offline Functionality
**FlutterFlow Setup:**
- Cache API responses locally
- Queue create/update actions when offline
- Sync when connection restored
- Show offline indicator

## 8. AI Features Integration

### Weather Integration
- **Location:** Dashboard widget
- **API:** `GET /api/dashboard/weather?projectId={id}`
- **Display:**
  - Current temp, conditions, icon
  - 3-day forecast
  - Construction impact alerts
- **Refresh:** Every 30 minutes

### AI Material Estimation
- **Location:** Materials section
- **API:** `POST /api/materials/estimate`
- **Trigger:** Manual button press
- **Uses:** Gemini API via backend

### Cost Prediction
- **Location:** Budget section
- **API:** `POST /api/budget/predict-costs`
- **Trigger:** Manual or auto-refresh daily
- **Uses:** Historical data + market trends

### Sustainability Score
- **Location:** Dashboard + Materials section
- **API:** `GET /api/dashboard/sustainability-score`
- **Auto-recalculates when:**
  - Material added/updated
  - Usage logged
  - Waste logged

### Progress Prediction
- **Location:** Dashboard
- **API:** `GET /api/dashboard/analytics`
- **Shows:** Predicted completion date based on current velocity

## 9. API Integration Checklist for FlutterFlow

### Base Configuration
- **Base URL:** http://localhost:5000 (dev) / https://your-domain.com (prod)
- **Authentication:** FlutterFlow built-in auth (no backend tokens required for MVP)
- **Headers:** Content-Type: application/json

### API Groups to Create

**Dashboard APIs**
- Overview
- Analytics
- Weather
- Sustainability Score

**Material APIs**
- List, Create, Update, Delete
- Log Usage
- Log Waste
- AI Estimate

**Task APIs**
- List, Create, Update, Delete
- Update Status
- Add Photo
- Log Time

**Budget APIs**
- Get, Create, Update
- Add Expense
- Cost Prediction
- Generate Report

**Document APIs**
- List, Upload, Download, Delete
- Extract Text
- Generate Task

### Error Handling
- Show user-friendly error messages
- Retry logic for failed requests
- Validation before API calls

## 10. Data Models for FlutterFlow

Create these data types matching backend schemas:

### Project
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "location": "string",
  "startDate": "datetime",
  "expectedEndDate": "datetime",
  "status": "enum",
  "progressPercentage": "number",
  "sustainabilityScore": "number",
  "projectType": "enum",
  "projectSize": "object",
  "teamSize": "number"
}
```

### Material
```json
{
  "id": "string",
  "name": "string",
  "category": "enum",
  "quantity": "number",
  "unit": "enum",
  "unitCost": "number",
  "supplier": "string",
  "ecoFriendly": "boolean",
  "totalUsage": "number",
  "totalWaste": "number",
  "currentInventory": "number",
  "needsReorder": "boolean"
}
```

### Task
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "status": "enum",
  "priority": "enum",
  "deadline": "datetime",
  "assignedTo": "array",
  "timeLogs": "array",
  "photos": "array",
  "totalHours": "number",
  "isOverdue": "boolean"
}
```

### Budget
```json
{
  "id": "string",
  "totalBudget": "number",
  "totalExpenses": "number",
  "remainingBudget": "number",
  "utilizationPercentage": "number",
  "allocations": "object",
  "expenses": "array",
  "contingencyPercentage": "number",
  "alertLevel": "string"
}
```

### Document
```json
{
  "id": "string",
  "filename": "string",
  "originalName": "string",
  "fileType": "string",
  "fileSize": "number",
  "category": "enum",
  "description": "string",
  "tags": "array",
  "extractedText": "object",
  "generatedTasks": "array",
  "isImage": "boolean",
  "processingStatus": "enum"
}
```

## 11. Screen Wireframe Summary

### Authentication Screens
- **Login Page:** Email/password form, forgot password link, login button
- **Sign Up Page:** Registration form with email, password, name
- **Forgot Password Page:** Email input, reset link sent confirmation

### Main Navigation (Bottom Nav)
All main screens accessible via bottom navigation bar with 5 tabs

### Dashboard Screens
- **Dashboard Home:** Project overview card, sustainability score widget, weather widget, 4 navigation cards, progress chart
- **Project Details:** Full project information, edit option

### Materials Screens
- **Materials List:** Scrollable list of material cards, filter/sort options, + button
- **Material Details:** Full material info, usage logs, waste logs, actions
- **Add Material Form:** Form with all material fields
- **Log Usage Form:** Quantity, purpose, notes fields
- **Log Waste Form:** Quantity, reason, notes fields
- **AI Estimation:** Input project params, results list with confidence scores
- **Sustainability Dashboard:** Score display, breakdown charts, recommendations

### Tasks Screens
- **Tasks List:** Tabs for status filtering, task cards, + button
- **Task Details:** Tabs for details/photos/time logs
- **Create Task Form:** All task fields including worker multi-select
- **Add Photo:** Camera/gallery picker, caption input
- **Log Time Form:** Hours, description, date picker

### Budget Screens
- **Budget Dashboard:** Budget overview, charts, expense summary, actions
- **Set Budget Form:** Total budget, allocations, contingency slider
- **Add Expense Form:** All expense fields
- **Expenses List:** Filtered list with category/status filters
- **Cost Predictions:** AI-generated price predictions with charts
- **Budget Report:** Detailed breakdown, export options

### Documents Screens
- **Documents List:** Category tabs, document cards, + button
- **Document Details:** Preview, metadata, extracted text, actions
- **Upload Document Form:** File picker, category, description, tags
- **Generate Task Form:** Pre-filled from document, editable

## 12. Implementation Priority

### Phase 1: Core Screens (Week 1-2)
**Authentication**
- Login screen with FlutterFlow auth
- Sign up screen
- Password recovery

**Dashboard with basic data**
- Project overview card
- Navigation to 4 sections
- Basic API integration

**Materials list + add/view**
- Materials list screen
- Add material form
- Material details view

**Tasks list + create/assign**
- Tasks list with filters
- Create task form
- Task details view

**Budget overview + log expenses**
- Budget dashboard
- Set budget form
- Add expense form

### Phase 2: Enhanced Features (Week 3)
**Material usage/waste logging**
- Log usage form
- Log waste form
- Updated calculations

**Task photo upload + time logging**
- Photo upload functionality
- Time log form
- Photo gallery view

**Document upload + list**
- Documents list
- Upload document form
- Document details view

**Weather integration**
- Weather widget on dashboard
- Real-time weather data

**AI material estimation**
- Estimation input form
- Results display
- Add to inventory option

### Phase 3: AI & Advanced (Week 4)
**Sustainability scoring with recommendations**
- Sustainability dashboard
- Score breakdown
- AI recommendations display

**Cost prediction**
- Cost predictions screen
- Trend charts
- Market insights

**Image to text extraction**
- Auto-trigger on image upload
- Processing indicator
- Extracted text display

**Task generation from documents**
- Generate task button
- Pre-filled task form
- Task creation confirmation

**Progress predictions**
- Completion date prediction
- Confidence intervals
- Progress trends

**Offline capability**
- Local data caching
- Offline mode indicator
- Sync when online

**Polish UI/UX**
- Consistent styling
- Loading states
- Error handling
- Animations and transitions

## 13. FlutterFlow-Specific Implementation Notes

### API Setup in FlutterFlow
**Create API Group:**
1. Go to Settings → API Calls
2. Create new API Group called "ConstructionBackend"
3. Set Base URL

**Add Individual API Calls:**
1. For each endpoint, create an API call
2. Set method (GET, POST, PATCH, DELETE)
3. Define URL path with variables
4. Configure request body for POST/PATCH
5. Map response fields

**Test API Calls:**
1. Use FlutterFlow's API testing feature
2. Verify response structure
3. Adjust field mappings as needed

### State Management
**App State Variables:**
- currentProjectId (string)
- currentUserId (string)
- userEmail (string)
- isOffline (boolean)

**Page State Variables:**
- Loading states for each screen
- Filter selections
- Form field values

### Custom Actions (if needed)
**Image Upload:**
- Custom action for file upload with FormData
- Progress tracking

**Polling for Document Processing:**
- Periodic API calls every 3-5 seconds
- Stop when processing complete

**Offline Sync:**
- Queue pending actions
- Sync when connectivity restored

### Widgets & Components
**Reusable Components:**
- Material Card
- Task Card
- Document Card
- Status Badge
- Priority Indicator
- Loading Indicator

**Navigation:**
- Bottom Navigation Bar (5 tabs)
- App Bar with context actions
- Drawer (optional for settings)

### Data Display
**Charts:**
- Use FlutterFlow's Chart widget or integrate fl_chart package
- Progress trends (line chart)
- Budget allocation (pie chart)
- Expenses by category (bar chart)

**Lists:**
- ListView for scrollable lists
- GridView for photo galleries
- Tabs for categorized content

## 14. Notes

- All API calls require `projectId` query parameter (stored in app state)
- Use Flutter packages: http/dio for API calls, image_picker, file_picker
- Implement pull-to-refresh on all list screens
- Add loading indicators for all async operations
- Color-code status indicators consistently across app:
  - **Red:** Critical/Overdue/Error
  - **Yellow:** Warning/Medium priority
  - **Green:** Success/Completed/On track
  - **Blue:** In progress/Information
- Use icons from Material Icons or custom assets
- Ensure responsive design for different screen sizes
- Test on both Android and iOS if targeting both platforms
- Handle edge cases: empty states, error states, no internet connection
- Add success/error snackbars for user feedback on actions
- Implement form validation before API calls
- Use placeholder data during development for easier UI testing

## 15. Quick Start Checklist

### Before Starting in FlutterFlow:
- [ ] Review all user flows in this document
- [ ] Have backend API running and accessible
- [ ] Have test project data in backend
- [ ] Collect icons and assets needed
- [ ] Plan color scheme and branding

### FlutterFlow Initial Setup:
- [ ] Create new FlutterFlow project
- [ ] Enable FlutterFlow Authentication
- [ ] Set up Email/Password auth
- [ ] Configure API base URL
- [ ] Create app state variables
- [ ] Set up bottom navigation structure

### Phase 1 Development:
- [ ] Build authentication screens
- [ ] Build dashboard with basic layout
- [ ] Connect dashboard APIs
- [ ] Build materials list and forms
- [ ] Build tasks list and forms
- [ ] Build budget screens
- [ ] Test core functionality

### Phase 2 Development:
- [ ] Add material usage/waste logging
- [ ] Add task photo upload
- [ ] Add task time logging
- [ ] Add document management
- [ ] Integrate weather API
- [ ] Add AI material estimation

### Phase 3 Development:
- [ ] Add sustainability dashboard
- [ ] Add cost prediction
- [ ] Add image to text extraction
- [ ] Add task generation from documents
- [ ] Add progress predictions
- [ ] Implement offline capability
- [ ] Polish UI and test thoroughly

### Final Steps:
- [ ] Comprehensive testing
- [ ] Fix bugs and edge cases
- [ ] Optimize performance
- [ ] Build APK for Android
- [ ] Deploy backend to production
- [ ] Update API base URL in app
- [ ] Final testing on production
- [ ] User acceptance testing
- [ ] Launch MVP

---

**Document Version:** 1.0  
**Last Updated:** October 10, 2025  
**Created for:** Sustainable Construction MVP App - FlutterFlow Implementation


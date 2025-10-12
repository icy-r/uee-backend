# FlutterFlow Task UI Component Generation Prompts

## Overview
This document contains detailed prompts for generating task-related UI components for the Sustainable Construction MVP app. Each prompt can be used with AI code generators, FlutterFlow, or as guidance for manual development.

**Backend API Reference:** `uee-backend` - Task routes are defined in `src/routes/task.routes.js` and `src/controllers/task.controller.js`

---

## 1. Task List View Component

### Prompt 1.1: Main Task List Screen with Status Tabs

```
Create a FlutterFlow screen called "TaskListScreen" with the following specifications:

LAYOUT:
- AppBar with title "Tasks" and actions: [Search icon, Filter icon, Add (+) icon]
- TabBar below AppBar with 4 tabs: "All", "Not Started", "In Progress", "Completed"
- Each tab shows a ListView of task cards
- Floating Action Button (FAB) at bottom-right for adding new tasks
- Pull-to-refresh functionality
- Empty state message when no tasks exist: "No tasks yet. Tap + to create one"

TASK CARD DESIGN (for list items):
- Card with elevation 2, rounded corners (radius: 12)
- Top row: Task title (bold, 16px) | Status badge (right-aligned)
- Second row: Priority indicator dot | Description preview (2 lines max, ellipsis)
- Third row: Deadline icon + date | Assigned workers avatars (max 3 shown, +N if more)
- Fourth row: Clock icon + total hours | Camera icon + photo count badge
- Overdue tasks: Red accent border on left (4px width)

STATUS BADGE COLORS:
- Not Started: Gray background, dark gray text
- In Progress: Blue background, white text
- Completed: Green background, white text

PRIORITY INDICATORS:
- Low: Green dot (8px)
- Medium: Yellow/Orange dot (8px)
- High: Red dot (8px)

API INTEGRATION:
- On load: GET /api/tasks?projectId={currentProjectId}
- Tab selection: Add &status={selected_status} query parameter
- Store response in page state variable: tasksList (List)
- Pull-to-refresh: Reload API call

INTERACTIONS:
- Tap task card → Navigate to TaskDetailsScreen with taskId parameter
- Tap FAB or + icon → Navigate to CreateTaskScreen
- Tap filter icon → Show FilterDialog (filter by priority, assigned workers, date range)
- Tap search icon → Show search bar to filter tasks by title/description

STATE MANAGEMENT:
- Page state: tasksList, isLoading, selectedTab, searchQuery
- Show loading spinner while API call is in progress
- Handle empty states for each tab separately
```

### Prompt 1.2: Task Card Component (Reusable)

```
Create a reusable custom component in FlutterFlow called "TaskCard" with the following:

COMPONENT PARAMETERS (inputs):
- task (Object) - contains: id, title, description, status, priority, deadline, assignedTo, totalHours, photos
- onTap (Action) - callback when card is tapped

CARD LAYOUT:
Container with:
- Padding: 16px all sides
- Margin: 8px horizontal, 4px vertical
- Background: White
- Border radius: 12px
- Elevation/shadow: 2
- Left border accent: 4px width (red if overdue, transparent otherwise)

Content (Column):
1. Row:
   - Text: task.title (font weight: 600, size: 16px, color: #212121)
   - Spacer
   - Status badge (Container with colored background, text, padding: 6px 12px, border radius: 16px)

2. Row (margin top: 4px):
   - Priority dot (Container: width 8px, height 8px, border radius: 4px, color based on priority)
   - Padding: 4px
   - Text: task.description (max lines: 2, overflow: ellipsis, color: #666, size: 14px)

3. Row (margin top: 8px):
   - Icon: Calendar (size: 16px, color: task.isOverdue ? Colors.red : #999)
   - Text: formatted deadline date (color: task.isOverdue ? Colors.red : #666)
   - Spacer
   - Stack of avatar images (assignedTo workers, circular, 28px diameter, max 3 shown)
   - If assignedTo.length > 3: Show "+N" badge

4. Row (margin top: 8px):
   - Icon: Clock (size: 16px, color: #999)
   - Text: "${task.totalHours}h logged" (color: #666, size: 12px)
   - Padding: 8px
   - Icon: Camera (size: 16px, color: #999)
   - Badge: photo count (if photos.length > 0)

CONDITIONAL RENDERING:
- Show red left border only if task.isOverdue == true
- Show "Overdue" label in red if task.isOverdue == true
- If task.assignedTo is empty: Show "Unassigned" text instead of avatars
- If task.totalHours == 0: Show "No time logged" instead of hours

COLOR MAPPING:
Priority colors:
- low: Colors.green[400]
- medium: Colors.orange[400]
- high: Colors.red[400]

Status badge colors:
- not_started: Background: #E0E0E0, Text: #424242
- in_progress: Background: #2196F3, Text: #FFFFFF
- completed: Background: #4CAF50, Text: #FFFFFF
```

### Prompt 1.3: Task Filter Dialog

```
Create a FlutterFlow dialog component called "TaskFilterDialog" with:

DIALOG PROPERTIES:
- Title: "Filter Tasks"
- Width: 90% of screen width
- Rounded corners: 16px
- Actions: "Clear All", "Apply" buttons

FILTER OPTIONS (Column layout):

1. Section: "Priority" (Chip selection)
   - Multi-select chips: Low, Medium, High
   - Selected chips: Filled with accent color
   - Store selection in: selectedPriorities (List<String>)

2. Section: "Assigned To" (Dropdown multi-select)
   - Load workers list from API or app state
   - Show worker names with checkboxes
   - Store in: selectedWorkers (List<String>)

3. Section: "Deadline" (Date range picker)
   - Two date fields: "From" and "To"
   - Date picker widgets
   - Store in: startDate, endDate (DateTime)

4. Section: "Photo Count" (Switch)
   - Toggle: "Only tasks with photos"
   - Store in: hasPhotos (bool)

5. Section: "Overdue Status" (Switch)
   - Toggle: "Show only overdue tasks"
   - Store in: showOverdueOnly (bool)

ACTIONS:
- "Clear All" button: Reset all filter values to default/empty
- "Apply" button: 
  - Close dialog
  - Build query parameters from selected filters
  - Call API: GET /api/tasks?projectId={id}&priority={priorities}&assignedTo={workers}&startDate={start}&endDate={end}
  - Update task list with filtered results
- "Cancel" (X button): Close dialog without applying

STYLING:
- Section headers: Font weight 600, size 14px, color #424242, margin bottom 8px
- Spacing between sections: 16px
- Buttons: Primary color for Apply, text button for Clear All
```

---

## 2. Task Creation Form

### Prompt 2.1: Create Task Screen

```
Create a FlutterFlow screen called "CreateTaskScreen" with:

APPBAR:
- Title: "Create New Task"
- Leading: Back arrow button
- Actions: None

FORM LAYOUT (Scrollable Column):
All form fields in a Card with padding 16px:

1. Title Field (Required)
   - Label: "Task Title *"
   - TextField: Single line
   - Max length: 100 characters
   - Validation: Required, min 3 characters
   - Error message: "Title is required (min 3 characters)"

2. Description Field (Required)
   - Label: "Description *"
   - TextField: Multiline, min height 120px
   - Max length: 500 characters
   - Validation: Required, min 10 characters
   - Show character counter

3. Priority Dropdown (Required)
   - Label: "Priority *"
   - Options: Low, Medium, High
   - Default: Medium
   - Each option shows colored dot indicator

4. Deadline Date Picker (Required)
   - Label: "Deadline *"
   - Date picker field
   - Validation: Must be future date
   - Error: "Deadline must be in the future"
   - Format: MMM dd, yyyy (e.g., Oct 15, 2025)

5. Assign Workers (Optional)
   - Label: "Assign To"
   - Multi-select dropdown
   - Load workers from: GET /api/projects/{projectId}/team or app state
   - Show selected workers as chips below field
   - Allow removing chips

6. Notes Field (Optional)
   - Label: "Additional Notes"
   - TextField: Multiline, min height 80px
   - Max length: 300 characters

7. Estimated Hours (Optional)
   - Label: "Estimated Hours"
   - Number input
   - Min: 0, Max: 1000
   - Step: 0.5

BOTTOM ACTIONS:
- Two buttons in a row:
  - "Cancel" (Outline button) → Navigate back
  - "Create Task" (Filled button, primary color) → Submit form

FORM VALIDATION:
- Validate on submit button tap
- Show error messages for invalid fields
- Scroll to first error field
- Disable submit button while API call is in progress

API INTEGRATION:
- On submit: POST /api/tasks
- Request body:
  {
    "projectId": "{currentProjectId}",
    "title": "{title}",
    "description": "{description}",
    "priority": "{priority}",
    "deadline": "{deadline in ISO format}",
    "assignedTo": ["{workerId1}", "{workerId2}"],
    "notes": "{notes}",
    "estimatedHours": {estimatedHours}
  }
- On success:
  - Show snackbar: "Task created successfully"
  - Navigate back to TaskListScreen
  - Refresh task list
- On error:
  - Show snackbar with error message
  - Keep form data intact

STYLING:
- Form field spacing: 16px between fields
- Labels: Font weight 500, size 14px, color #424242
- Required fields marked with * in red
- Text fields: Outlined border, rounded corners 8px
- Focus color: Primary app color
- Submit button: Full width, height 48px, border radius 8px
```

### Prompt 2.2: Worker Selection Multi-Picker Component

```
Create a custom component "WorkerMultiPicker" for assigning workers to tasks:

COMPONENT PARAMETERS:
- selectedWorkers (List<String>) - IDs of selected workers
- onWorkersChanged (Action) - Callback with updated list

LAYOUT:
1. Trigger Button:
   - Text: "Select Workers" or "{count} workers selected"
   - Icon: Person add icon
   - Border: 1px solid #DDD, rounded 8px
   - Full width, height 48px
   - On tap: Open bottom sheet

2. Selected Workers Chips (Wrap):
   - Show below button if workers selected
   - Chip per worker: Avatar + Name + Remove (X) icon
   - On X tap: Remove worker from selection

3. Bottom Sheet (when opened):
   - Title: "Assign Workers"
   - Search bar at top for filtering workers
   - List of workers with checkboxes:
     * Avatar (circular, 40px)
     * Worker name and email
     * Checkbox (checked if selected)
   - Bottom actions:
     * "Cancel" button
     * "Done" button → Close sheet, trigger onWorkersChanged

DATA SOURCE:
- Load from API: GET /api/projects/{projectId}/team
- Or use app state: appState.projectTeamMembers
- Worker object: { id, name, email, avatar }

SEARCH FUNCTIONALITY:
- Filter workers by name or email as user types
- Case-insensitive search
- Update list in real-time

STYLING:
- Bottom sheet max height: 70% of screen
- Worker list item height: 64px
- Spacing between items: 8px
- Selected worker chips: Primary color background, white text
```

---

## 3. Task Details Screen

### Prompt 3.1: Task Details Main Screen with Tabs

```
Create a FlutterFlow screen "TaskDetailsScreen" with:

ROUTE PARAMETERS:
- taskId (String) - passed from task list

APPBAR:
- Title: task.title (or "Task Details" if loading)
- Leading: Back arrow
- Actions: Edit icon, More (3-dot menu with Delete option)

API CALL:
- On page load: GET /api/tasks/{taskId}
- Store in page state: taskData (Object)
- Show loading spinner while loading

SCREEN LAYOUT (Column):

1. Task Header Card (Non-scrollable):
   - Background: Gradient or solid primary color
   - Padding: 16px
   - Content:
     * Task title (font size 20px, bold, white/contrast color)
     * Row: Status badge | Priority indicator | Overdue label (if applicable)
     * Row: Deadline with icon | Estimated hours with icon
     * Assigned workers avatars in a row

2. TabBar with 3 tabs:
   - "Details"
   - "Photos" (with badge showing count)
   - "Time Logs" (with badge showing count)

3. TabBarView (Scrollable content per tab):
   
   TAB 1 - DETAILS:
   - Card: Description section
     * Label: "Description"
     * Text: Full description, selectable
   
   - Card: Status Update section
     * Label: "Update Status"
     * Dropdown with status options: Not Started, In Progress, Completed
     * On change: Call PATCH /api/tasks/{taskId}/status with { status: newStatus }
     * Show loading indicator in dropdown during API call
   
   - Card: Assigned Workers section
     * Label: "Assigned To"
     * List of worker names with avatars
     * If editable: Add/remove worker buttons
   
   - Card: Additional Information
     * Notes field (if exists)
     * Created date
     * Last updated date
     * Created by (user name)
   
   TAB 2 - PHOTOS:
   - Top button: "Add Photo" (icon + text)
   - GridView of photos (2 columns, aspect ratio 1:1)
   - Each photo card shows:
     * Photo thumbnail
     * Caption overlay on bottom (if exists)
     * Date added text
   - Tap photo: Open full screen image viewer with caption
   - Empty state: "No photos yet. Tap Add Photo to upload."
   
   TAB 3 - TIME LOGS:
   - Top button: "Log Time" (icon + text)
   - Total hours banner at top (large text, highlighted)
   - List of time log entries (most recent first):
     * Each entry shows:
       - Hours logged (bold, 18px)
       - Description of work
       - Date (formatted: Oct 12, 2025)
       - Logged by (worker name)
   - Empty state: "No time logged yet. Tap Log Time to add."

FLOATING ACTION BUTTON (context-aware):
- On Details tab: Edit task button
- On Photos tab: Add photo button (camera icon)
- On Time Logs tab: Log time button (clock icon)

ERROR HANDLING:
- If API call fails: Show error message with retry button
- If task not found: Show "Task not found" and back button

STYLING:
- Cards: White background, elevation 1, border radius 12px, margin 8px
- Section labels: Font weight 600, size 14px, color #424242, margin bottom 8px
- Spacing between cards: 8px
```

### Prompt 3.2: Status Update Dropdown Component

```
Create a custom status update component "TaskStatusDropdown" for task details:

COMPONENT PARAMETERS:
- currentStatus (String) - current task status
- taskId (String) - task ID for API call
- onStatusChanged (Action) - callback when status successfully updated

DROPDOWN WIDGET:
- Current status displayed with colored badge
- Dropdown items: not_started, in_progress, completed
- Each item shows:
  * Status badge with color
  * Status text (formatted: "Not Started", "In Progress", "Completed")
  * Checkmark icon if current status

ON STATUS SELECTION:
1. Show confirmation dialog (optional for moving to "completed"):
   - "Are you sure you want to mark this task as completed?"
   - Yes/No buttons
2. Call API: PATCH /api/tasks/{taskId}/status
   - Body: { "status": "{newStatus}" }
3. Show loading indicator during API call
4. On success:
   - Update local state
   - Show snackbar: "Status updated to {newStatus}"
   - Trigger onStatusChanged callback
   - Refresh parent screen if needed
5. On error:
   - Show error snackbar
   - Revert dropdown to previous status

STATUS COLORS (consistent with task cards):
- not_started: Gray (#9E9E9E)
- in_progress: Blue (#2196F3)
- completed: Green (#4CAF50)

DROPDOWN STYLING:
- Height: 48px
- Border: 1px solid #E0E0E0, rounded 8px
- Padding: 12px
- Full width
- Icon: Dropdown arrow (right aligned)

CONFIRMATION DIALOG STYLING:
- Title: Font weight 600, size 18px
- Message: Size 14px, color #666
- Actions: Cancel (text button), Confirm (filled button)
```

### Prompt 3.3: Photo Grid Component for Task

```
Create a custom component "TaskPhotoGrid" showing task photos:

COMPONENT PARAMETERS:
- photos (List) - Array of photo objects: { id, url, caption, uploadedAt, uploadedBy }
- taskId (String) - for adding new photos
- canAddPhotos (bool) - whether to show add button

LAYOUT:

1. If canAddPhotos: Add Photo Button (top)
   - Container: Dashed border, rounded 8px
   - Icon: Camera icon (large, 32px)
   - Text: "Add Photo"
   - On tap: Show ActionSheet → Choose Camera or Gallery
   - Height: 120px, centered content

2. Photo Grid (GridView):
   - 2 columns
   - Aspect ratio: 1:1
   - Spacing: 8px between items
   - Each photo card:
     * Image (fit: cover, rounded corners 8px)
     * Caption overlay (bottom):
       - Semi-transparent black background
       - White text, max 2 lines, ellipsis
     * On tap: Navigate to full-screen photo viewer

3. Empty State (if no photos):
   - Icon: Camera outline (gray, large)
   - Text: "No photos yet"
   - Subtext: "Add photos to track progress visually"

PHOTO UPLOAD FLOW:
1. User selects camera or gallery
2. Image picker opens
3. After selecting image:
   - Show preview dialog with caption input field
   - "Cancel" and "Upload" buttons
4. On upload:
   - Show progress indicator
   - API call: POST /api/tasks/{taskId}/photos
   - Body: FormData with { photo: file, caption: text }
5. On success:
   - Add new photo to grid
   - Show snackbar: "Photo uploaded"
   - Refresh photos list
6. On error:
   - Show error snackbar

FULL-SCREEN PHOTO VIEWER (new screen/dialog):
- Black background
- Image centered, pinch to zoom enabled
- Caption at bottom (white text on semi-transparent background)
- Top bar: Back button (X), Delete button, Share button
- Swipe left/right to navigate between photos (if multiple)

STYLING:
- Photo cards: Elevation 2, rounded corners 8px
- Caption overlay: Background color: rgba(0,0,0,0.6), padding 8px
- Add button: Border: 2px dashed #BDBDBD, background: #FAFAFA
```

### Prompt 3.4: Time Log List Component

```
Create a custom component "TimeLogList" for displaying and adding time logs:

COMPONENT PARAMETERS:
- timeLogs (List) - Array of time log objects: { id, hours, description, date, loggedBy }
- taskId (String) - for adding new logs
- totalHours (number) - calculated total
- canLogTime (bool) - whether user can add time logs

LAYOUT:

1. Total Hours Banner (top, sticky):
   - Container: Primary color background, padding 16px
   - Large text: "{totalHours} hours" (font size 24px, bold, white)
   - Subtext: "Total time logged" (size 14px, white with 80% opacity)

2. If canLogTime: Add Time Log Button
   - Full width button
   - Text: "Log Time" + clock icon
   - On tap: Open LogTimeDialog

3. Time Logs List (ListView):
   - Sort: Most recent first
   - Each item (Card):
     * Top row:
       - Hours logged (bold, 18px, primary color) + "hours" text
       - Date (right-aligned, gray, 12px)
     * Description text (14px, color #424242, max lines: 3)
     * Bottom row:
       - Clock icon + timestamp (12px, gray)
       - Logged by: worker name (12px, gray)
     * Divider between items
   - Item padding: 12px, margin: 4px vertical

4. Empty State (if no logs):
   - Icon: Clock outline (gray, large)
   - Text: "No time logged yet"
   - Subtext: "Track hours spent on this task"

TIME LOG DIALOG (Modal):
- Title: "Log Time"
- Form fields:
  1. Hours worked (Number input)
     - Label: "Hours *"
     - Min: 0.25, Max: 24, Step: 0.25
     - Validation: Required, must be > 0
  
  2. Description (Text area)
     - Label: "Description of work done *"
     - Max length: 300 characters
     - Validation: Required, min 5 characters
  
  3. Date (Date picker)
     - Label: "Date"
     - Default: Today
     - Max: Today (can't log future time)
  
  4. Actions:
     - "Cancel" button
     - "Log Time" button (primary)

- On submit:
  - Validate fields
  - API call: POST /api/tasks/{taskId}/time-logs
  - Body: { hours, description, date }
  - On success:
    - Close dialog
    - Add new log to list
    - Update total hours
    - Show snackbar: "Time logged successfully"
  - On error:
    - Show error message in dialog

STYLING:
- Banner gradient: Primary to primary dark
- List items: Background white, border-left: 3px solid primary color
- Hours text color: Primary color
- Dialog: Rounded corners 16px, padding 20px
```

---

## 4. Task Assignment Components

### Prompt 4.1: Worker Avatar Group Component

```
Create a reusable component "WorkerAvatarGroup" showing assigned workers:

COMPONENT PARAMETERS:
- workers (List) - Array of worker objects: { id, name, email, avatarUrl }
- maxVisible (int) - Maximum avatars to show before "+N" (default: 3)
- size (double) - Avatar size in pixels (default: 32)
- showNames (bool) - Whether to show names below avatars (default: false)

LAYOUT (Row or Wrap based on showNames):

If workers is empty:
- Show single gray avatar with "?" icon
- Text: "Unassigned" (if showNames is true)

If workers has items:
1. Stack of avatar images (overlapping if not showNames):
   - Each avatar: Circular image, size = {size}px
   - If no avatarUrl: Show initials in colored circle (first letter of first and last name)
   - Border: 2px white border (for overlapping effect)
   - Overlap amount: size * 0.3 (if not showNames)
   - Max visible: {maxVisible} avatars

2. If workers.length > maxVisible:
   - Show "+N" badge as last item
   - Badge: Circular container, same size as avatar
   - Background: Primary color or gray
   - Text: "+{remaining count}" (white, bold, centered)

3. If showNames is true:
   - Column layout for each worker:
     * Avatar (top)
     * Name text (bottom, size 12px, centered, max lines 1)
   - Spacing between workers: 8px

AVATAR COLORS (for initials):
- Generate color based on worker ID or name (consistent for same person)
- Use predefined color palette: Blues, Greens, Purples, Oranges
- Text color: White

ON TAP BEHAVIOR (optional):
- If tapped: Show tooltip or bottom sheet with all worker names
- Bottom sheet: List of workers with full details (avatar, name, email)

STYLING:
- Avatar border: 2px solid white (for contrast)
- Avatar shadow: subtle shadow for depth
- "+N" badge: slightly darker shade than avatars
```

### Prompt 4.2: Assign Worker Bottom Sheet

```
Create a bottom sheet component "AssignWorkerSheet" for adding/removing workers:

TRIGGER:
- Called from task details or task creation form

SHEET PROPERTIES:
- Height: 70% of screen
- Rounded top corners: 20px
- Background: White
- Drag handle at top

LAYOUT:

1. Header (sticky):
   - Title: "Assign Workers" (font size 18px, bold)
   - Close button (X icon, top-right)
   - Search bar:
     * TextField with search icon
     * Placeholder: "Search workers..."
     * Real-time filtering

2. Selected Workers Section (if any selected):
   - Label: "Selected ({count})"
   - Horizontal scrollable list of selected worker chips
   - Chip: Avatar + Name + Remove (X) button
   - On X tap: Deselect worker

3. Available Workers List (scrollable):
   - List of all project workers
   - Each item (ListTile):
     * Leading: Avatar (circular, 40px)
     * Title: Worker name (font size 16px)
     * Subtitle: Worker email or role (font size 14px, gray)
     * Trailing: Checkbox (checked if selected)
     * On tap: Toggle selection
   - Divider between items

4. Bottom Actions (sticky):
   - Row with 2 buttons:
     * "Cancel" (text button) → Close without saving
     * "Done" (filled button, full width) → Save and close

DATA LOADING:
- API call: GET /api/projects/{projectId}/team
- Or use app state: appState.projectTeamMembers
- Show loading indicator while fetching
- Cache results for session

SEARCH FUNCTIONALITY:
- Filter workers by name or email
- Case-insensitive
- Update list in real-time as user types
- Show "No results" message if no matches

SELECTION HANDLING:
- Maintain selected workers in component state
- On "Done":
  - Return selected workers to parent
  - Trigger onWorkersChanged callback
  - Close sheet

STYLING:
- Header padding: 16px, border-bottom: 1px solid #E0E0E0
- Search bar: Outlined, rounded 24px, height 40px, margin 8px
- Selected chips: Primary color, removable, height 32px
- List item height: 64px
- Done button: Primary color, height 48px
```

---

## 5. Task Priority and Status Indicators

### Prompt 5.1: Priority Indicator Component

```
Create a reusable component "PriorityIndicator" showing task priority:

COMPONENT PARAMETERS:
- priority (String) - "low", "medium", or "high"
- variant (String) - "dot", "badge", or "chip" (default: "dot")
- size (String) - "small", "medium", "large" (default: "medium")

VARIANT: DOT
- Small circular container
- Sizes:
  * small: 6px diameter
  * medium: 8px diameter
  * large: 12px diameter
- Colors:
  * low: #4CAF50 (green)
  * medium: #FF9800 (orange)
  * high: #F44336 (red)
- No text, just colored circle

VARIANT: BADGE
- Rectangular container with rounded corners
- Padding: 4px 8px (small), 6px 12px (medium), 8px 16px (large)
- Background: Priority color with 20% opacity
- Text: Priority label ("Low", "Medium", "High")
- Text color: Priority color (full opacity)
- Text size: 10px (small), 12px (medium), 14px (large)
- Font weight: 500

VARIANT: CHIP
- Similar to badge but with icon
- Leading icon: Circle (same color as priority)
- Text: Priority label
- Background: White with colored border (1px)
- Border color: Priority color

PRIORITY MAPPING:
- low: Green (#4CAF50), Icon: arrow_downward
- medium: Orange (#FF9800), Icon: drag_handle (horizontal lines)
- high: Red (#F44336), Icon: arrow_upward

USAGE EXAMPLES:
- Task cards: Use "dot" variant, small size
- Task details: Use "badge" variant, medium size
- Filters/tags: Use "chip" variant, medium size
```

### Prompt 5.2: Status Badge Component

```
Create a reusable component "StatusBadge" for task status:

COMPONENT PARAMETERS:
- status (String) - "not_started", "in_progress", "completed"
- variant (String) - "filled", "outlined", "subtle" (default: "filled")
- size (String) - "small", "medium", "large" (default: "medium")
- showIcon (bool) - whether to show status icon (default: false)

STATUS CONFIGURATIONS:
1. not_started:
   - Label: "Not Started"
   - Color: #9E9E9E (gray)
   - Icon: radio_button_unchecked

2. in_progress:
   - Label: "In Progress"
   - Color: #2196F3 (blue)
   - Icon: pending or rotate_right

3. completed:
   - Label: "Completed"
   - Color: #4CAF50 (green)
   - Icon: check_circle

VARIANT: FILLED
- Background: Status color
- Text color: White
- Padding: 4px 10px (small), 6px 14px (medium), 8px 18px (large)
- Border radius: 12px (small), 16px (medium), 20px (large)
- Font size: 10px (small), 12px (medium), 14px (large)
- Font weight: 500

VARIANT: OUTLINED
- Background: Transparent
- Border: 1.5px solid status color
- Text color: Status color
- Same padding and sizing as filled

VARIANT: SUBTLE
- Background: Status color with 15% opacity
- Text color: Status color (full opacity)
- No border
- Same padding and sizing as filled

WITH ICON:
- If showIcon is true:
  - Add icon before text
  - Icon size: 14px (small), 16px (medium), 18px (large)
  - Icon color: Same as text color
  - Spacing between icon and text: 4px

STYLING:
- All variants: Center-aligned text
- Text: Uppercase (optional) or Title Case
- Shadow: None for outlined, subtle shadow (elevation 1) for filled
```

---

## 6. Task Filtering and Sorting

### Prompt 6.1: Task Sort Options Menu

```
Create a popup menu component "TaskSortMenu" for sorting tasks:

TRIGGER:
- Icon button in app bar (sort icon)
- Shows menu on tap

MENU ITEMS (RadioListTile):
1. "Deadline (Earliest first)"
2. "Deadline (Latest first)"
3. "Priority (High to Low)"
4. "Priority (Low to High)"
5. "Status (Not Started first)"
6. "Recently Updated"
7. "Recently Created"
8. "Most Time Logged"
9. "Alphabetical (A-Z)"

CURRENT SELECTION:
- Show checkmark icon for currently selected sort option
- Store selection in page state: currentSortOption (String)

ON SELECTION:
1. Update currentSortOption
2. Close menu
3. Re-sort tasks list based on selected option
4. Optionally: Add sort parameter to API call
   - Example: GET /api/tasks?projectId={id}&sortBy=deadline&order=asc

SORT LOGIC (if client-side):
- Deadline earliest: Sort by deadline date ascending, nulls last
- Priority high to low: high → medium → low
- Status: not_started → in_progress → completed
- Recently updated: Sort by updatedAt descending

STYLING:
- Menu background: White
- Item height: 48px
- Selected item: Light blue background (primary color, 10% opacity)
- Checkmark icon: Primary color
- Font size: 14px
- Divider: Between groups (deadline, priority, status, etc.)
```

### Prompt 6.2: Advanced Task Filter Sidebar/Panel

```
Create a drawer or side panel component "TaskFilterPanel" with comprehensive filters:

LAYOUT:

1. Header:
   - Title: "Filters" (font size 20px, bold)
   - Close button (X icon)
   - "Reset All" text button (clears all filters)

2. Filter Sections (Scrollable):

   SECTION: Status
   - Checkbox list:
     * Not Started
     * In Progress
     * Completed
   - Allow multiple selections

   SECTION: Priority
   - Checkbox list with colored dots:
     * 🔴 High Priority
     * 🟠 Medium Priority
     * 🟢 Low Priority
   - Allow multiple selections

   SECTION: Deadline
   - Radio buttons:
     * Any time
     * Overdue
     * Due today
     * Due this week
     * Due this month
     * Custom range (shows date pickers if selected)

   SECTION: Assigned Workers
   - Multi-select dropdown or chip selection
   - Options: All workers + "Unassigned"
   - Show worker avatars with names

   SECTION: Time Logged
   - Slider or range input:
     * Min hours: 0
     * Max hours: (calculate from data)
   - Labels: "0h" to "Max hours"

   SECTION: Photos
   - Checkbox: "Has photos"
   - Checkbox: "Has 5+ photos"

   SECTION: Created/Updated
   - Date range picker
   - Options: Created date or Updated date (toggle)

3. Footer (Sticky at bottom):
   - Row with 2 buttons:
     * "Clear Filters" (outline button)
     * "Apply Filters" (filled button, primary)
   - Show active filter count: "(3 active)" next to Apply button

FILTER STATE:
- Store all filter selections in component state
- On "Apply": Pass filter object to parent
- Filter object structure:
  {
    status: ["in_progress", "not_started"],
    priority: ["high", "medium"],
    deadline: { type: "custom", start: "2025-10-01", end: "2025-10-31" },
    assignedTo: ["worker1", "worker2"],
    timeLogged: { min: 5, max: 20 },
    hasPhotos: true,
    createdDate: { start: "2025-09-01", end: "2025-10-12" }
  }

API INTEGRATION:
- Build query string from filter object
- Example: GET /api/tasks?projectId={id}&status=in_progress,not_started&priority=high,medium&hasPhotos=true
- Or filter client-side if all data is loaded

UI BEHAVIOR:
- Each section is collapsible (accordion style)
- Show filter count badge on section headers if filters applied in that section
- Persist filter state during session (optional)

STYLING:
- Panel width: 320px (desktop), 90% (mobile)
- Section headers: Font weight 600, size 16px, expandable icon
- Padding: 16px per section
- Background: White or light gray (#F5F5F5)
- Apply button: Full width, height 48px
```

---

## 7. Task Progress and Analytics

### Prompt 7.1: Task Progress Chart Component

```
Create a chart component "TaskProgressChart" showing completion trends:

COMPONENT PARAMETERS:
- projectId (String) - to fetch analytics data
- dateRange (String) - "week", "month", "quarter" (default: "month")

API CALL:
- GET /api/dashboard/analytics?projectId={id}&range={dateRange}
- Response: { completionTrend: [{ date, completed, inProgress, notStarted }] }

CHART TYPE: Line Chart or Bar Chart

CHART DATA:
- X-axis: Dates (formatted: Oct 1, Oct 8, etc.)
- Y-axis: Task count
- Series:
  1. Completed tasks (Green line/bars)
  2. In Progress tasks (Blue line/bars)
  3. Not Started tasks (Gray line/bars)

CHART FEATURES:
- Legend showing each series with color
- Grid lines on Y-axis
- Tooltips on data points showing exact counts
- Animated on load
- Responsive to container size

TOP SECTION (above chart):
- Date range selector (Segmented button or dropdown):
  * Last 7 Days
  * Last 30 Days
  * Last 3 Months
- Refresh button

SUMMARY CARDS (below chart):
- Row of 3 small cards:
  1. Total Completed
     - Large number: {count}
     - Icon: check_circle (green)
     - Subtext: "tasks completed"
  
  2. Avg. Completion Time
     - Large number: {days} days
     - Icon: schedule
     - Subtext: "average duration"
  
  3. Completion Rate
     - Large number: {percentage}%
     - Icon: trending_up
     - Subtext: "of all tasks"

EMPTY STATE:
- If no data: Show message "No data available for selected period"
- Show illustration or icon

STYLING:
- Chart height: 280px
- Card background: White, elevation 1
- Padding: 16px
- Chart colors: Match app theme
- Use FlutterFlow chart widget or integrate fl_chart package
```

### Prompt 7.2: Task Statistics Dashboard Widget

```
Create a dashboard widget "TaskStatisticsWidget" for overview:

LAYOUT (Card with sections):

1. Header:
   - Title: "Task Overview"
   - Subtitle: "Project: {projectName}"
   - Refresh icon button (right-aligned)

2. Status Distribution (Pie or Donut Chart):
   - Visual representation of tasks by status
   - Segments:
     * Completed (Green): X%
     * In Progress (Blue): Y%
     * Not Started (Gray): Z%
   - Center text (if donut): Total task count
   - Legend below chart

3. Priority Breakdown (Horizontal bar chart or stacked bars):
   - 3 bars showing distribution:
     * High priority: Count + percentage
     * Medium priority: Count + percentage
     * Low priority: Count + percentage
   - Color-coded bars
   - Labels on left, values on right

4. Quick Stats Grid (2x2):
   - Cell 1: Overdue Tasks
     * Red icon (warning)
     * Count (large, red if > 0)
   
   - Cell 2: Due This Week
     * Orange icon (calendar)
     * Count
   
   - Cell 3: Total Hours Logged
     * Blue icon (clock)
     * "{hours}h" text
   
   - Cell 4: Avg. Hours per Task
     * Purple icon (bar_chart)
     * "{avg}h" text

5. Recent Activity (Optional):
   - Small list (max 3 items) showing:
     * "Task X was completed" (with timestamp)
     * "Task Y status updated" (with timestamp)
   - "View all activity" link

API CALLS:
- GET /api/tasks?projectId={id}&$select=status,priority,totalHours,deadline
- Process data client-side for charts and stats
- Or use dedicated endpoint: GET /api/dashboard/task-stats?projectId={id}

REFRESH BEHAVIOR:
- Pull-to-refresh or refresh button
- Reload all API data
- Update charts and numbers
- Show loading indicator during refresh

STYLING:
- Card: White background, rounded corners 12px, elevation 2
- Padding: 16px
- Charts: Use app's color scheme
- Stats grid: Equal cell sizes, icons 32px, numbers 24px bold
- Spacing between sections: 16px
```

---

## 8. Task Deadline and Reminder Components

### Prompt 8.1: Deadline Display Component

```
Create a component "TaskDeadlineDisplay" showing deadline with visual indicators:

COMPONENT PARAMETERS:
- deadline (DateTime) - task deadline
- status (String) - task status (to determine if overdue is relevant)
- variant (String) - "compact", "detailed", "banner" (default: "compact")

DEADLINE STATUS CALCULATION:
- Overdue: deadline < now AND status != "completed"
- Due Today: deadline is today
- Due Soon: deadline within next 3 days
- Upcoming: deadline > 3 days from now

VARIANT: COMPACT
- Single row layout
- Icon: Calendar icon
- Text: Formatted date (Oct 15, 2025)
- Color based on status:
  * Overdue: Red text and icon
  * Due Today: Orange text and icon
  * Due Soon: Yellow/Orange text
  * Upcoming: Default gray text

VARIANT: DETAILED
- Column layout
- Label: "Deadline"
- Date: Large text (16px bold)
- Relative time: "(in 3 days)" or "(2 days overdue)"
- Color and icon same as compact
- If overdue: Show warning icon before text

VARIANT: BANNER
- Full-width container with colored background
- Background colors:
  * Overdue: Light red (#FFEBEE)
  * Due Today: Light orange (#FFF3E0)
  * Due Soon: Light yellow (#FFFDE7)
  * Upcoming: Light blue (#E3F2FD)
- Icon on left (matching severity)
- Text: "Due {date}" or "Overdue by {days} days"
- Font weight: 500
- Padding: 12px 16px

COUNTDOWN TIMER (optional for detailed/banner):
- Show countdown for "Due Today"
- Format: "Due in 5 hours" or "Due in 45 minutes"
- Update in real-time

FORMATTING:
- Date formats:
  * If this year: "Oct 15" or "October 15, 2025"
  * If next year: "Jan 5, 2026"
- Relative time:
  * "in X days", "in X hours", "tomorrow"
  * "X days ago", "yesterday"

STYLING:
- Compact: Inline, height 24px
- Detailed: Min height 48px, center-aligned
- Banner: Full width, min height 44px
```

### Prompt 8.2: Task Reminder/Notification Settings

```
Create a settings component "TaskReminderSettings" for task notifications:

LAYOUT (Dialog or Bottom Sheet):

HEADER:
- Title: "Set Reminders"
- Subtitle: "for {taskTitle}"
- Close button

REMINDER OPTIONS:

1. Due Date Reminder (Switch):
   - Toggle: "Remind me before deadline"
   - If enabled, show options:
     * Checkbox: "1 day before" (default checked)
     * Checkbox: "3 days before"
     * Checkbox: "1 week before"
     * Custom: Time picker for specific time

2. Daily Reminder (Switch):
   - Toggle: "Daily reminder for in-progress tasks"
   - If enabled:
     * Time picker: Select reminder time (default 9:00 AM)
     * Days: Select days of week (checkboxes)

3. Overdue Reminder (Switch):
   - Toggle: "Remind if task becomes overdue"
   - If enabled:
     * Frequency: Dropdown (Once, Daily, Every 3 hours)

4. Status Change Notifications (Switch):
   - Toggle: "Notify on status changes"
   - Description: "Get notified when task status is updated"

5. Time Log Reminder (Switch):
   - Toggle: "Remind to log time"
   - If enabled:
     * Frequency: Dropdown (Daily, Every 2 days, Weekly)
     * Time: Time picker

NOTIFICATION CHANNELS:
- Section: "Notification Methods"
- Checkboxes:
  * Push notifications (mobile)
  * Email notifications
  * In-app notifications

BOTTOM ACTIONS:
- "Cancel" button
- "Save Reminders" button (primary)

DATA STORAGE:
- Store reminder settings per task
- API endpoint: PATCH /api/tasks/{taskId}/reminders
- Request body:
  {
    "dueDate": { "enabled": true, "timings": ["1day", "3days"] },
    "daily": { "enabled": true, "time": "09:00", "days": [1,2,3,4,5] },
    "overdue": { "enabled": true, "frequency": "daily" },
    "statusChange": true,
    "timeLog": { "enabled": true, "frequency": "daily", "time": "17:00" },
    "channels": ["push", "email"]
  }

NOTIFICATION ICON:
- Show bell icon with badge on task card if reminders are set
- Badge shows number of active reminders

STYLING:
- Sections divided by subtle dividers
- Switches: Primary color when enabled
- Subtext/descriptions: Font size 12px, gray color
- Time pickers: Formatted 12-hour or 24-hour based on locale
```

---

## 9. Task Templates and Quick Actions

### Prompt 9.1: Task Quick Actions Menu

```
Create a quick actions menu "TaskQuickActionsMenu" showing on long-press:

TRIGGER:
- Long press on task card in list view
- Or three-dot menu in task card

MENU OPTIONS (List):

1. "Quick Status Update" → Show status options submenu
   - Not Started
   - In Progress
   - Completed
   - Each with status icon and color

2. "Assign to Me" (if not already assigned)
   - Icon: person_add
   - Quick action: Add current user to assignedTo

3. "Duplicate Task"
   - Icon: content_copy
   - Creates copy of task with "(Copy)" appended to title

4. "Log Time"
   - Icon: schedule
   - Opens time log dialog

5. "Add Photo"
   - Icon: camera_alt
   - Opens camera/gallery picker

6. "Share Task"
   - Icon: share
   - Opens share dialog with task details

7. "Set Reminder"
   - Icon: notifications
   - Opens reminder settings

8. "Mark as Priority"
   - Icon: flag
   - Cycles through priority levels (low → medium → high)

9. "Delete Task" (with confirmation)
   - Icon: delete (red)
   - Shows confirmation dialog

MENU STYLING:
- White background, elevation 8
- Rounded corners: 12px
- Each item: Height 48px, horizontal padding 16px
- Icon size: 24px, gray color
- Text: 14px, left-aligned
- Divider: Between dangerous actions (like delete)
- Hover/press: Light gray background

ANIMATIONS:
- Menu appears with scale and fade animation
- Dismiss on tap outside or on selection

ACTION HANDLING:
- Each action triggers appropriate API call
- Show loading indicator during API call
- Show success/error snackbar
- Update task in list without full refresh if possible
```

### Prompt 9.2: Task Template Selector

```
Create a component "TaskTemplateSelector" for quick task creation from templates:

USAGE:
- Show as option in Create Task screen
- Or as separate "Quick Add" flow

LAYOUT (Bottom Sheet or Dialog):

HEADER:
- Title: "Task Templates"
- Subtitle: "Create task from template"
- Search bar for filtering templates

TEMPLATE CATEGORIES (Tabs or Sections):
- Common Tasks
- Project-Specific
- Custom Templates
- Recent

TEMPLATE CARD LAYOUT:
- Grid view (2 columns on mobile, 3-4 on tablet)
- Each card shows:
  * Template icon/emoji
  * Template name
  * Brief description
  * "Use Template" button or tap entire card
- Example templates:
  1. "Site Inspection"
  2. "Material Delivery"
  3. "Quality Check"
  4. "Safety Audit"
  5. "Progress Report"
  6. "Team Meeting"

TEMPLATE STRUCTURE:
Each template contains:
- title (string)
- description (string)
- priority (string)
- estimatedHours (number)
- defaultAssignees (array) - optional
- subtasks (array) - optional
- checklistItems (array) - optional

ON TEMPLATE SELECTION:
1. Load template data
2. Navigate to Create Task screen
3. Pre-fill form fields with template values
4. User can edit before saving
5. Title appended with date: "{Template Name} - Oct 12"

TEMPLATE MANAGEMENT:
- "Create Template" option (saves current task as template)
- Edit templates (admin/manager only)
- Delete templates (with confirmation)
- API endpoints:
  * GET /api/task-templates?projectId={id}
  * POST /api/task-templates
  * DELETE /api/task-templates/{templateId}

CUSTOM TEMPLATE CREATION:
- From task details, show "Save as Template" option
- Dialog:
  * Template name input
  * Template description (optional)
  * Category selection
  * Save button
- API call to save template

STYLING:
- Template cards: White background, elevation 1, rounded 12px
- Icon: Large (48px), centered at top of card
- Name: Bold, 14px
- Description: Gray, 12px, max 2 lines
- "Use" button: Small, outlined, primary color
- Search bar: Rounded, with search icon
```

---

## 10. Mobile-Specific Task UI Features

### Prompt 10.1: Task Swipe Actions (Mobile)

```
Create swipeable task card with actions for mobile:

SWIPE GESTURES:

LEFT SWIPE (Primary actions):
- Reveal action buttons as card slides left
- Actions (in order):
  1. "Complete" button (Green background, checkmark icon)
     - Full swipe or tap: Mark task as completed
     - API: PATCH /api/tasks/{taskId}/status { status: "completed" }
  
  2. "Edit" button (Blue background, edit icon)
     - Tap: Navigate to edit task screen

RIGHT SWIPE (Secondary actions):
- Reveal actions as card slides right
- Actions:
  1. "Delete" button (Red background, delete icon)
     - Tap: Show confirmation dialog
     - On confirm: DELETE /api/tasks/{taskId}
  
  2. "More" button (Gray background, more_vert icon)
     - Tap: Show full quick actions menu

SWIPE BEHAVIOR:
- Partial swipe: Show action buttons, card returns on release
- Full swipe (threshold: 70% of card width): Execute primary action directly
- Elastic resistance when swiping beyond buttons
- Smooth animation (duration: 200ms)

VISUAL FEEDBACK:
- Background color shows behind card as it slides
- Icons become visible as swipe progresses
- Haptic feedback on threshold crossed (if available)
- Undo snackbar after completion (5 seconds)

ACCESSIBILITY:
- Provide alternative tap-and-hold menu for non-swipe users
- Voice-over support: Announce actions available on swipe
- Keyboard navigation support

IMPLEMENTATION NOTES:
- Use FlutterFlow's Swipeable widget or custom GestureDetector
- Prevent swipe conflicts with parent scrollable widgets
- Disable swipe during loading states

STYLING:
- Action buttons: Width 80px, height = card height
- Icons: White, 24px
- Background colors:
  * Complete: #4CAF50
  * Edit: #2196F3
  * Delete: #F44336
  * More: #757575
```

### Prompt 10.2: Task Voice Input Component

```
Create a voice input component "TaskVoiceInput" for hands-free task creation:

TRIGGER BUTTON:
- Floating microphone button
- Primary color background
- Pulse animation when listening
- Position: Bottom-right (or alternative to main FAB)

VOICE INPUT FLOW:

1. Initial State:
   - Button shows mic icon
   - On tap: Request microphone permission if needed
   - Start voice recognition

2. Listening State:
   - Button shows animated waveform or pulsing effect
   - Semi-transparent overlay on screen
   - Text: "Listening..." or "Speak now"
   - Cancel button (X icon)
   - Real-time transcription shown as user speaks

3. Processing State:
   - Button shows loading spinner
   - Text: "Processing..."
   - Voice data sent to backend for parsing

4. Result State:
   - Show parsed task details
   - Preview card with:
     * Extracted title
     * Extracted description
     * Detected priority (if mentioned)
     * Detected deadline (if mentioned)
   - Actions:
     * "Create Task" (if details are sufficient)
     * "Edit Details" (opens form with pre-filled data)
     * "Try Again" (restart voice input)

VOICE PARSING:
- API endpoint: POST /api/tasks/voice-parse
- Send audio or transcribed text
- Backend uses NLP/AI to extract:
  * Task title (first sentence or key phrase)
  * Description (remaining content)
  * Priority keywords: "urgent", "high priority", "important" → high
  * Deadline keywords: "tomorrow", "next week", "by Friday", etc.
  * Assignment keywords: "assign to John", "for the team"

Example input: "Create a high priority task to inspect the foundation by Friday. Need to check for any cracks or water damage. Assign it to John."

Parsed output:
- title: "Inspect the foundation"
- description: "Check for any cracks or water damage"
- priority: "high"
- deadline: [next Friday's date]
- assignedTo: ["John"]

ERROR HANDLING:
- If speech not recognized: Show "Didn't catch that. Try again?"
- If no microphone permission: Show settings dialog
- If parsing fails: Show "Couldn't parse task. Please enter manually"
- Network error: Show retry option

ACCESSIBILITY:
- Text alternative for voice input
- Support for speech-to-text accessibility features
- Visual feedback for users who can't hear audio cues

STYLING:
- Overlay: Dark background, 50% opacity
- Listening indicator: Waveform animation or pulsing circle
- Transcription text: Large, readable, center-aligned
- Preview card: White background, rounded corners, elevation 4
```

---

## Usage Instructions

1. **Copy the desired prompt** from this document
2. **Customize parameters** such as colors, sizes, and API endpoints to match your project
3. **Use with AI code generators** like:
   - FlutterFlow AI component generator
   - GPT/Claude for Flutter code generation
   - GitHub Copilot with Flutter project context
4. **Adjust the generated code** as needed for your specific backend API structure
5. **Test thoroughly** on both iOS and Android devices
6. **Iterate** based on user feedback and edge cases

---

## Additional Resources

- **Backend API Reference**: See `uee-backend/src/routes/task.routes.js` for all available endpoints
- **Data Models**: Refer to `uee-backend/src/models/Task.js` for task schema
- **FlutterFlow Documentation**: https://docs.flutterflow.io/
- **Flutter Widget Catalog**: https://flutter.dev/docs/development/ui/widgets

---

**Document Version:** 1.0  
**Last Updated:** October 12, 2025  
**Created for:** Sustainable Construction MVP - Task Module UI Components


# FlutterFlow Task UI Component Generation Prompts

## Overview
Concise prompts (max 1000 chars) for generating task-related UI components. Each prompt is AI-generator ready.

**Backend API:** `src/routes/task.routes.js` and `src/controllers/task.controller.js`

---

## 1. Task List View Components

### Prompt 1.1: Main Task List Screen
```
Create FlutterFlow "TaskListScreen": AppBar with title "Tasks" + Search/Filter/Add icons. TabBar with 4 tabs (All, Not Started, In Progress, Completed). ListView of task cards per tab. FAB bottom-right. Pull-to-refresh. Empty state: "No tasks yet. Tap + to create one". Task cards: elevation 2, radius 12px, show title (bold 16px), status badge (right), priority dot, description (2 lines), deadline icon+date, worker avatars (max 3, +N), hours logged, photo count. Red left border (4px) if overdue. Status colors: Gray/Blue/Green. Priority dots: Green/Orange/Red (8px). API: GET /api/tasks?projectId={id}&status={status}. Store in tasksList. Navigate to TaskDetailsScreen on tap, CreateTaskScreen on FAB. Page state: tasksList, isLoading, selectedTab, searchQuery.
```

### Prompt 1.2: Task Card Component
```
Reusable "TaskCard" component. Inputs: task object (id, title, description, status, priority, deadline, assignedTo, totalHours, photos), onTap callback. Layout: Container padding 16px, margin 8px/4px, white background, radius 12px, elevation 2. Red left border (4px) if overdue. Column: 1) Title (bold 16px) + status badge (6px/12px padding, radius 16px), 2) Priority dot (8px) + description (2 lines, ellipsis, gray 14px), 3) Calendar icon + deadline + worker avatars (28px, max 3, +N badge), 4) Clock icon + "{totalHours}h logged" + camera icon + photo count. Color mapping: not_started=#E0E0E0, in_progress=#2196F3, completed=#4CAF50. Priority: low=green, medium=orange, high=red.
```

### Prompt 1.3: Task Filter Dialog
```
Create "TaskFilterDialog": Title "Filter Tasks", width 90%, radius 16px. Filter sections: 1) Priority (multi-select chips: Low/Medium/High), 2) Assigned To (multi-select dropdown with checkboxes), 3) Deadline (date range: From/To pickers), 4) Photo Count (toggle "Only tasks with photos"), 5) Overdue Status (toggle "Show only overdue"). Actions: "Clear All" (text button) resets filters, "Apply" (primary button) closes dialog and calls GET /api/tasks?projectId={id}&priority={}&assignedTo={}&startDate={}&endDate={}. Store selections in: selectedPriorities, selectedWorkers, startDate, endDate, hasPhotos, showOverdueOnly. Section headers: 600 weight, 14px, #424242.
```

---

## 2. Task Creation Form

### Prompt 2.1: Create Task Screen
```
"CreateTaskScreen": AppBar "Create New Task" + back button. Scrollable form card (padding 16px): 1) Title* (TextField, max 100 chars, validation: min 3), 2) Description* (multiline, 120px height, max 500, show counter), 3) Priority* (Dropdown: Low/Medium/High with colored dots, default Medium), 4) Deadline* (DatePicker, must be future, format: MMM dd, yyyy), 5) Assign Workers (multi-select with chips), 6) Notes (multiline, 80px, max 300), 7) Estimated Hours (number, 0-1000, step 0.5). Bottom: "Cancel" outline + "Create Task" filled buttons. On submit: POST /api/tasks with {projectId, title, description, priority, deadline, assignedTo[], notes, estimatedHours}. Success: snackbar + navigate back. Validate on submit, scroll to first error.
```

### Prompt 2.2: Worker Multi-Picker
```
"WorkerMultiPicker" component. Inputs: selectedWorkers (List), onWorkersChanged callback. Trigger button: "Select Workers" or "{count} selected", person icon, border 1px #DDD, radius 8px, height 48px. Opens bottom sheet on tap. Sheet (70% height): title "Assign Workers", search bar (filter by name/email), worker list with checkboxes (avatar 40px + name + email). Selected workers show as chips below button (avatar + name + X icon). Bottom actions: "Cancel" + "Done". Load from GET /api/projects/{projectId}/team or app state. Search: real-time, case-insensitive. On Done: trigger onWorkersChanged with updated list. Selected chips: primary color bg, white text.
```

---

## 3. Task Details Screen

### Prompt 3.1: Task Details with Tabs
```
"TaskDetailsScreen" (route param: taskId). Load: GET /api/tasks/{taskId}. AppBar: task.title + back + edit + delete (3-dot menu). Header card: gradient bg, padding 16px, title (20px bold), status badge + priority + overdue label, deadline + hours, worker avatars. TabBar: Details/Photos (badge)/Time Logs (badge). Tab 1-Details: Description card, status dropdown (updates via PATCH /api/tasks/{taskId}/status), assigned workers list, notes, created/updated dates. Tab 2-Photos: "Add Photo" button, 2-column GridView (aspect 1:1), photo thumbnails with caption overlay, tap for fullscreen viewer. Tab 3-Time Logs: "Log Time" button, total hours banner, list of entries (hours bold 18px, description, date, logged by). Empty states per tab. FAB: context-aware (edit/photo/time).
```

### Prompt 3.2: Status Update Dropdown
```
"TaskStatusDropdown" component. Inputs: currentStatus, taskId, onStatusChanged callback. Dropdown shows colored badge with status. Items: not_started, in_progress, completed. Each shows badge + formatted text + checkmark if current. On select: show confirmation dialog for "completed", call PATCH /api/tasks/{taskId}/status {status: newStatus}, loading indicator during call. Success: update state, snackbar "Status updated", trigger callback. Error: snackbar, revert dropdown. Status colors: not_started=#9E9E9E, in_progress=#2196F3, completed=#4CAF50. Dropdown: height 48px, border 1px #E0E0E0, radius 8px, padding 12px, full width.
```

### Prompt 3.3: Photo Grid Component
```
"TaskPhotoGrid". Inputs: photos array ({id, url, caption, uploadedAt}), taskId, canAddPhotos bool. Layout: 1) Add button (if canAddPhotos): dashed border, camera icon 32px, "Add Photo" text, height 120px, tap opens ActionSheet (Camera/Gallery), 2) GridView 2 columns, aspect 1:1, 8px spacing, photo cards with caption overlay (semi-transparent black, white text, 2 lines), tap for fullscreen viewer. Empty: camera outline icon + "No photos yet". Upload flow: select image, preview dialog with caption input, POST /api/tasks/{taskId}/photos (FormData), progress indicator, success adds to grid. Fullscreen viewer: black bg, image centered, pinch zoom, caption bottom, swipe navigation, back/delete/share buttons.
```

### Prompt 3.4: Time Log List
```
"TimeLogList" component. Inputs: timeLogs array ({id, hours, description, date, loggedBy}), taskId, totalHours, canLogTime bool. Layout: 1) Total hours banner (sticky, primary bg, padding 16px, "{totalHours} hours" 24px bold white, subtext "Total time logged"), 2) "Log Time" button if canLogTime, 3) List sorted recent first, each card: hours (bold 18px primary) + date (right, gray 12px), description (14px, max 3 lines), clock icon + timestamp + "Logged by: {name}" (12px gray), dividers between items. Empty: clock outline + "No time logged yet". Log Time Dialog: Hours* (number 0.25-24, step 0.25), Description* (textarea max 300, min 5), Date (picker, max today). POST /api/tasks/{taskId}/time-logs {hours, description, date}.
```

---

## 4. Task Assignment Components

### Prompt 4.1: Worker Avatar Group
```
"WorkerAvatarGroup" component. Inputs: workers array ({id, name, email, avatarUrl}), maxVisible int (default 3), size double (default 32px), showNames bool (default false). Empty: gray avatar with "?", text "Unassigned". With workers: Stack of circular avatars (size px, white 2px border), overlap by size*0.3 if not showNames. Show max {maxVisible}, then "+N" badge (circular, primary/gray bg, white bold text, same size). If showNames: Column per worker (avatar top, name 12px centered max 1 line), 8px spacing. Avatar colors: generate from ID/name, use blues/greens/purples/oranges palette, white text for initials (first letter first+last name). Optional: tap shows tooltip/bottom sheet with all workers.
```

### Prompt 4.2: Assign Worker Sheet
```
"AssignWorkerSheet" bottom sheet, height 70%, rounded top 20px. Header (sticky): title "Assign Workers" 18px bold + X button, search bar (icon, placeholder "Search workers...", real-time filter). Selected section: "Selected ({count})" label, horizontal scrollable chips (avatar + name + X to remove). Available workers list: scrollable, ListTile per worker (avatar 40px + name 16px + email/role 14px gray + checkbox trailing), dividers, tap toggles selection. Bottom (sticky): "Cancel" text + "Done" filled buttons. Load: GET /api/projects/{projectId}/team or app state, show loading. Search: case-insensitive name/email, show "No results" if empty. On Done: return selected to parent, trigger onWorkersChanged, close.
```

---

## 5. Status & Priority Indicators

### Prompt 5.1: Priority Indicator
```
"PriorityIndicator" component. Inputs: priority (low/medium/high), variant (dot/badge/chip, default dot), size (small/medium/large, default medium). DOT: circular, sizes 6/8/12px, colors: low=#4CAF50, medium=#FF9800, high=#F44336. BADGE: rounded rect, padding 4px-8px/6px-12px/8px-16px, background priority color 20% opacity, text colored full opacity, text size 10/12/14px, weight 500. CHIP: white bg with colored 1px border, leading icon (circle same color), text label, icons: low=arrow_downward, medium=drag_handle, high=arrow_upward. Usage: task cards use dot/small, task details use badge/medium, filters use chip/medium.
```

### Prompt 5.2: Status Badge
```
"StatusBadge" component. Inputs: status (not_started/in_progress/completed), variant (filled/outlined/subtle, default filled), size (small/medium/large, default medium), showIcon bool (default false). Status configs: not_started="Not Started" #9E9E9E radio_button_unchecked, in_progress="In Progress" #2196F3 pending, completed="Completed" #4CAF50 check_circle. FILLED: status bg, white text, padding 4px-10px/6px-14px/8px-18px, radius 12/16/20px, size 10/12/14px, weight 500, elevation 1. OUTLINED: transparent bg, 1.5px border status color, text status color. SUBTLE: status bg 15% opacity, text status color full. With icon: add before text, size 14/16/18px, 4px spacing.
```

---

## 6. Filtering & Sorting

### Prompt 6.1: Task Sort Menu
```
"TaskSortMenu" popup on app bar sort icon tap. RadioListTile items: 1) Deadline (Earliest first), 2) Deadline (Latest first), 3) Priority (High to Low), 4) Priority (Low to High), 5) Status (Not Started first), 6) Recently Updated, 7) Recently Created, 8) Most Time Logged, 9) Alphabetical (A-Z). Show checkmark for current selection. Store in currentSortOption. On select: update state, close menu, re-sort list or add query param to GET /api/tasks?projectId={id}&sortBy={field}&order={asc/desc}. Sort logic: deadline asc (nulls last), priority high→med→low, status not_started→in_progress→completed, updatedAt desc. Menu: white bg, 48px items, selected light blue bg 10%, checkmark primary, 14px text, dividers between groups.
```

### Prompt 6.2: Task Filter Panel
```
"TaskFilterPanel" drawer/side panel, width 320px (mobile 90%). Header: "Filters" 20px bold + X + "Reset All" text button. Scrollable sections (collapsible accordion): 1) Status (checkboxes: Not Started/In Progress/Completed), 2) Priority (checkboxes with colored dots), 3) Deadline (radio: Any/Overdue/Today/This Week/This Month/Custom range), 4) Assigned Workers (multi-select/chips, include "Unassigned"), 5) Time Logged (slider range 0-max hours), 6) Photos (checkboxes: "Has photos"/"Has 5+ photos"), 7) Created/Updated (date range toggle). Footer (sticky): "Clear Filters" outline + "Apply Filters" filled + active count badge "(3 active)". On Apply: build query string, call GET /api/tasks with filters, or filter client-side. Section headers: 600/16px, expandable, show count badge if filters active. Padding 16px per section.
```

---

## 7. Progress & Analytics

### Prompt 7.1: Task Progress Chart
```
"TaskProgressChart" component. Inputs: projectId, dateRange (week/month/quarter, default month). API: GET /api/dashboard/analytics?projectId={id}&range={dateRange}, response: {completionTrend: [{date, completed, inProgress, notStarted}]}. Chart: Line/Bar, X-axis dates (formatted: Oct 1, Oct 8), Y-axis task count, 3 series (Completed green, In Progress blue, Not Started gray), legend, grid lines Y-axis, tooltips on hover, animated, responsive. Top: date range selector (segmented button/dropdown: 7 Days/30 Days/3 Months) + refresh button. Bottom: 3 summary cards (Total Completed with check_circle green, Avg. Completion Time "{days} days" with schedule, Completion Rate "{%}%" with trending_up). Empty: "No data available". Chart height 280px.
```

### Prompt 7.2: Task Statistics Widget
```
"TaskStatisticsWidget" dashboard card. Header: "Task Overview" + "Project: {name}" subtitle + refresh icon. Layout: 1) Status distribution pie/donut chart (Completed green %/In Progress blue %/Not Started gray %, center: total count, legend below), 2) Priority breakdown horizontal bars (High/Medium/Low with counts + %, color-coded), 3) Quick stats 2x2 grid: Overdue (red warning icon + count red if >0), Due This Week (orange calendar + count), Total Hours (blue clock + "{hours}h"), Avg. Hours/Task (purple bar_chart + "{avg}h"), 4) Recent activity list (max 3 items, "Task X completed" with timestamp, "View all" link). API: GET /api/tasks?projectId={id} or GET /api/dashboard/task-stats. Refresh: reload data, loading indicator. Card: white, radius 12px, elevation 2, padding 16px.
```

---

## 8. Deadline & Reminders

### Prompt 8.1: Deadline Display
```
"TaskDeadlineDisplay" component. Inputs: deadline DateTime, status, variant (compact/detailed/banner, default compact). Status calc: overdue (deadline<now AND status!="completed"), due today, due soon (3 days), upcoming. COMPACT: row, calendar icon + formatted date (Oct 15, 2025), colors: overdue=red, today=orange, soon=yellow, upcoming=gray. DETAILED: column, label "Deadline", date 16px bold, relative time "(in 3 days)" or "(2 days overdue)", warning icon if overdue. BANNER: full-width colored container (overdue=#FFEBEE, today=#FFF3E0, soon=#FFFDE7, upcoming=#E3F2FD), icon left, text "Due {date}" or "Overdue by {days} days", weight 500, padding 12px/16px. Optional countdown for "Due Today": "Due in 5 hours", real-time update.
```

### Prompt 8.2: Reminder Settings
```
"TaskReminderSettings" dialog/sheet for task notifications. Header: "Set Reminders" + "for {taskTitle}" + close. Sections: 1) Due Date Reminder (switch, if enabled: checkboxes 1 day/3 days/1 week before + custom time picker), 2) Daily Reminder (switch, time picker default 9AM, day checkboxes), 3) Overdue Reminder (switch, frequency dropdown: Once/Daily/Every 3 hours), 4) Status Change (switch, "Notify on status changes"), 5) Time Log Reminder (switch, frequency dropdown Daily/Every 2 days/Weekly + time picker). Notification channels: checkboxes (Push/Email/In-app). Actions: "Cancel" + "Save Reminders" primary. API: PATCH /api/tasks/{taskId}/reminders with settings object. Show bell icon with badge on task card if reminders set.
```

---

## 9. Templates & Quick Actions

### Prompt 9.1: Quick Actions Menu
```
"TaskQuickActionsMenu" on long-press task card or 3-dot menu. Options: 1) Quick Status Update → submenu (Not Started/In Progress/Completed with icons), 2) Assign to Me (person_add, if not assigned), 3) Duplicate Task (content_copy, creates copy with "(Copy)"), 4) Log Time (schedule, opens dialog), 5) Add Photo (camera_alt, opens picker), 6) Share Task (share, opens share dialog), 7) Set Reminder (notifications, opens settings), 8) Mark as Priority (flag, cycles low→medium→high), 9) Delete Task (delete red, shows confirmation). Menu: white bg, elevation 8, radius 12px, items 48px height/16px padding, icons 24px gray, text 14px, divider before delete, scale+fade animation. Each action triggers API call, loading indicator, success/error snackbar, updates list without full refresh.
```

### Prompt 9.2: Task Template Selector
```
"TaskTemplateSelector" bottom sheet/dialog. Header: "Task Templates" + "Create from template" + search bar. Categories (tabs/sections): Common Tasks/Project-Specific/Custom/Recent. Template grid (2 cols mobile, 3-4 tablet): cards with icon/emoji, name, brief description, "Use Template" button or tap card. Examples: Site Inspection, Material Delivery, Quality Check, Safety Audit, Progress Report, Team Meeting. Template structure: {title, description, priority, estimatedHours, defaultAssignees[], subtasks[], checklistItems[]}. On select: load template, navigate to Create Task, pre-fill form (title appended with date "{Name} - Oct 12"), user edits before save. Template management: "Create Template" saves current task, edit/delete (admin only). API: GET /api/task-templates?projectId={id}, POST, DELETE /api/task-templates/{id}.
```

---

## 10. Mobile Features

### Prompt 10.1: Swipe Actions
```
Swipeable task card for mobile. LEFT SWIPE: reveal "Complete" button (green bg, checkmark icon, full swipe or tap marks completed, API: PATCH /api/tasks/{taskId}/status {status:"completed"}), "Edit" button (blue bg, edit icon, navigates to edit screen). RIGHT SWIPE: reveal "Delete" button (red bg, delete icon, shows confirmation, API: DELETE /api/tasks/{taskId}), "More" button (gray bg, more_vert icon, shows quick actions menu). Swipe: partial shows buttons (returns on release), full swipe (70% threshold) executes primary action, elastic resistance, 200ms animation, haptic feedback on threshold. Background colors show as card slides. Undo snackbar after completion (5s). Accessibility: tap-and-hold alternative, voice-over support. Prevent conflict with parent scroll.
```

### Prompt 10.2: Voice Input
```
"TaskVoiceInput" for hands-free creation. FAB: mic icon, primary color, pulse animation when listening, bottom-right position. Flow: 1) Tap requests permission, starts recognition, 2) Listening: animated waveform, overlay, "Listening..." text, cancel X, real-time transcription, 3) Processing: spinner, "Processing...", send to API, 4) Result: preview card with extracted title/description/priority/deadline, actions "Create Task"/"Edit Details"/"Try Again". API: POST /api/tasks/voice-parse, send audio/text, NLP extracts title (first sentence), description (remaining), priority (keywords: urgent/high/important→high), deadline (tomorrow/next week/by Friday), assignment (assign to John). Example: "high priority inspect foundation by Friday check cracks assign John" → parsed task. Errors: "Didn't catch that", no permission dialog, parsing failed→manual entry, retry on network error.
```

---

## Usage Instructions

1. **Copy any prompt** - Each is under 1000 characters
2. **Paste into AI generator** - Works with FlutterFlow AI, GPT, Claude, Copilot
3. **Customize** - Adjust colors, endpoints, or parameters as needed
4. **Generate & test** - Create component, test on devices, iterate

## API Quick Reference
- Tasks: `/api/tasks` (GET list, POST create)
- Task detail: `/api/tasks/{id}` (GET, PATCH, DELETE)
- Status: `/api/tasks/{id}/status` (PATCH)
- Photos: `/api/tasks/{id}/photos` (POST)
- Time logs: `/api/tasks/{id}/time-logs` (POST)
- Analytics: `/api/dashboard/analytics`
- Team: `/api/projects/{id}/team`

---

**Document Version:** 2.0  
**Last Updated:** October 12, 2025  
**Character Limit:** Max 1000 per prompt

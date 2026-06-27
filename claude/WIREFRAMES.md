
# WIREFRAMES.md

# FlowSense Screen Blueprint

## Design Language
- Inspired by Raycast, Linear, Arc
- Spacious layout
- Minimal chrome
- Keyboard-first

---

## Global Layout

+--------------------------------------------------------------+
| Search | Notifications | Theme | Local Status                |
+---------+--------------------------------------+-------------+
| Sidebar |                                      | Suggestions |
|         |           Main Content               | / Context   |
|         |                                      | Panel       |
+---------+--------------------------------------+-------------+

Sidebar:
- Dashboard
- Timeline
- Workflows
- Analytics
- Search
- Settings

---

## Dashboard
Cards:
- Active Time
- App Switches
- Top Apps
- Workflows Detected
- Suggestions

Below:
- Activity Timeline
- App Usage Chart
- Workflow Frequency Chart

---

## Timeline
Toolbar:
[Search] [Date] [Filter]

Activity Card:
Time | Icon | App | Window Title | URL

---

## Workflow Details
Header:
Name | Frequency | Confidence

Middle:
Step 1
 ↓
Step 2
 ↓
Step 3

Footer:
Accept | Dismiss | Rename

---

## Analytics
- Heatmap
- Pie Chart
- Weekly Trend
- Monthly Trend
- Productivity Score

---

## Settings
Tabs:
General
Privacy
AI
Appearance
Storage
Advanced

---

## UX Rules
- Max 3 clicks to any feature
- Skeleton loaders everywhere
- Empty states should educate
- Keyboard shortcuts visible
- Smooth 150–250ms animations

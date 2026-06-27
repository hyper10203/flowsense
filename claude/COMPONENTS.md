
# COMPONENTS.md

# UI Component Library

## Layout
- AppShell
- Sidebar
- Topbar
- ContentContainer
- ContextPanel

## Navigation
- NavItem
- Breadcrumb
- SearchBar
- CommandPalette

## Dashboard
- StatCard
- ActivityFeed
- WorkflowCard
- SuggestionCard
- HeatmapChart
- PieChartCard
- TimelineChart

## Timeline
- TimelineItem
- TimelineGroup
- DateFilter
- AppFilter

## Workflows
- WorkflowHeader
- WorkflowSteps
- ConfidenceBadge
- FrequencyBadge
- ActionButtons

## Analytics
- ChartCard
- MetricCard
- TrendIndicator

## Settings
- SettingsSection
- ToggleRow
- SliderSetting
- SelectSetting
- DangerZone

## Common Components
- Button
- Card
- Dialog
- Drawer
- Tooltip
- Dropdown
- Toast
- Spinner
- Skeleton
- EmptyState
- ErrorState

## Component Rules

Every component must:
- Have typed props
- Be reusable
- Support dark/light themes
- Be keyboard accessible
- Avoid inline styles
- Include loading & empty states where applicable

Naming:
PascalCase.tsx
One component per file.

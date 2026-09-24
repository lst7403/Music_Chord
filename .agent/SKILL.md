---

name: web-design-optimization
description: Optimize and redesign existing web application interfaces for professional UI/UX quality. Use when improving website layout, visual hierarchy, typography, spacing, components, responsive behavior, accessibility, interactions, dashboards, data visualization, or overall frontend design. Preserve existing functionality and application architecture while making the interface cleaner, more coherent, usable, and production-quality.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Web Design Optimization

## Purpose

Improve the existing web application's UI/UX to a professional, production-quality standard.

The objective is:

**Clear + Consistent + Usable + Modern + Product-specific**

Do not redesign the application merely to make it visually impressive.

Prioritize usability and information clarity over decoration.

---

# 1. Operating Rules

When this skill is active:

* Inspect the existing implementation before modifying it.
* Preserve existing functionality.
* Preserve existing backend behavior.
* Reuse existing components when appropriate.
* Prefer incremental improvements over unnecessary rewrites.
* Do not introduce a new framework unless technically necessary.
* Do not replace working functionality for aesthetic reasons.
* Do not create a generic SaaS dashboard unless the product actually requires one.
* Adapt the visual design to the application's domain.

Before making major changes, understand the current user workflow.

---

# 2. Inspect First

Before editing files, inspect the relevant project structure.

Identify:

* Frontend framework
* Entry points
* Main pages
* Layout components
* Reusable components
* CSS/style architecture
* Design tokens
* API integration
* State management
* Interactive elements
* Data visualizations
* Existing responsive behavior

Determine:

### Working

What already works correctly?

### Problems

What creates poor UX or visual inconsistency?

### Opportunities

What can be improved without changing application behavior?

Do not immediately rewrite the frontend.

---

# 3. Establish Visual Hierarchy

Every page should have a clear hierarchy.

Determine:

1. Page purpose
2. Primary information
3. Primary action
4. Secondary information
5. Supporting actions

Use:

* Typography
* Size
* Spacing
* Alignment
* Contrast
* Grouping

to establish hierarchy.

Do not make every element equally prominent.

---

# 4. Design System

Before styling many components, establish a consistent visual system.

## Typography

Use a small, consistent type scale.

Define styles for:

* Page title
* Section title
* Body
* Secondary text
* Caption
* Label

Avoid excessive font sizes and weights.

## Spacing

Use a consistent spacing scale.

Prefer:

```text
4
8
12
16
24
32
48
64
```

Avoid arbitrary spacing whenever possible.

## Color

Use a restrained semantic color system:

```text
background
surface
surface-elevated
text-primary
text-secondary
text-muted
border
primary
success
warning
error
```

Do not introduce unrelated colors for individual components.

## Radius

Use a small set of consistent radius values.

Avoid making every element heavily rounded.

## Shadows

Use subtle elevation only where useful.

Avoid excessive shadows.

---

# 5. Layout

Improve page composition before polishing individual components.

Prioritize:

* Clear content hierarchy
* Consistent container widths
* Logical grouping
* Appropriate whitespace
* Responsive grids
* Alignment

Avoid unnecessary nested containers.

Do not put every section inside a card.

Use cards when they communicate meaningful grouping or hierarchy.

---

# 6. Component Consistency

Create reusable visual patterns.

Common components include:

* Buttons
* Inputs
* Selects
* Tabs
* Cards
* Tables
* Badges
* Tooltips
* Modals
* Navigation
* Panels
* Dropdowns

Similar components should have:

* Consistent dimensions
* Consistent typography
* Consistent spacing
* Consistent interaction states

Do not independently style equivalent components in different ways.

---

# 7. Buttons

Use clear button hierarchy:

```text
Primary
Secondary
Tertiary
Destructive
Icon
```

Support:

```text
default
hover
active
focus
disabled
loading
```

The primary action should be visually obvious.

Do not make every button visually dominant.

---

# 8. Forms

Forms should minimize cognitive load.

Use:

* Clear labels
* Logical grouping
* Consistent spacing
* Appropriate input sizes
* Inline validation
* Clear error messages

Do not use placeholder text as the only label.

Preserve user input when validation fails.

---

# 9. Navigation

Users should immediately understand:

* Current location
* Available sections
* Active section
* Primary action

Use clear active states.

Avoid unnecessary navigation items.

On small screens, adapt navigation instead of simply shrinking it.

---

# 10. Data Visualization

For charts and interactive visualizations:

Prioritize:

1. Readability
2. Correct visual encoding
3. Interaction clarity
4. Information hierarchy
5. Visual consistency

Do not add decorative effects that reduce readability.

Interactive visualizations should have clear:

* Hover states
* Selection states
* Focus states
* Tooltips
* Labels
* Transitions

Keep unnecessary UI chrome away from the main visualization.

---

# 11. Data-Dense Interfaces

For dashboards, analytics, search, and data-heavy applications:

Optimize for scanning.

Important information should be visually easy to identify.

Use:

* Alignment
* Grouping
* Whitespace
* Typography
* Subtle separators

Avoid excessive:

* Cards
* Borders
* Icons
* Badges
* Decorative elements

Do not sacrifice information density simply to make the interface look minimal.

---

# 12. Loading / Empty / Error States

Every important asynchronous operation should have explicit states.

## Loading

Use an appropriate loading indicator or skeleton.

## Empty

Explain:

* What is missing
* Why it may be empty when useful
* What the user can do next

## Error

Explain the problem clearly.

Provide a recovery action when possible.

## Success

Use subtle confirmation for important actions.

---

# 13. Responsive Design

Do not simply scale down the desktop interface.

Determine how components should transform.

Examples:

```text
Desktop sidebar
→ Mobile drawer

Multi-column layout
→ Single-column layout

Large table
→ Horizontal scrolling or responsive representation

Secondary controls
→ Collapsible controls

Large navigation
→ Compact navigation
```

Check:

* Desktop
* Laptop
* Tablet
* Mobile

Prevent unintended horizontal overflow.

---

# 14. Accessibility

Follow basic accessibility principles.

Ensure:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Sufficient contrast
* Proper labels
* Accessible form controls
* Meaningful alt text

Never rely exclusively on color to communicate important information.

---

# 15. Interaction and Motion

Use animation to communicate state or relationships.

Good examples:

* Hover transitions
* Selection feedback
* Modal transitions
* Expand/collapse
* Loading transitions
* Panel transitions

Keep animation subtle and fast.

Avoid:

* Decorative animation
* Excessive bouncing
* Long transitions
* Constant movement

Respect reduced-motion preferences where appropriate.

---

# 16. Avoid Generic AI UI

Do not automatically use:

* Purple/blue gradients
* Excessive glassmorphism
* Huge hero sections
* Excessive rounded cards
* Heavy shadows
* Too many floating elements
* Too many badges
* Excessive icons
* Random colors
* Generic dashboard templates

Avoid making every section look like a card.

The interface should look intentionally designed for this specific product.

---

# 17. Product-Specific Design

The design must reflect the application's actual workflow.

For example:

### AI application

Emphasize:

* Input
* Processing
* Model status
* Results
* Explainability

### Data application

Emphasize:

* Search
* Filtering
* Sorting
* Tables
* Visualization

### Music application

Emphasize:

* Audio upload
* Playback
* Waveform
* Chord timeline
* Beat information
* Model results
* Interactive visualization

Do not apply the same layout pattern to unrelated products.

---

# 18. Implementation Order

When making substantial UI improvements, follow this order:

### Phase 1 — Structure

Fix:

* Layout
* Page hierarchy
* Navigation
* Content grouping

### Phase 2 — Design System

Fix:

* Typography
* Colors
* Spacing
* Borders
* Radius
* Shadows

### Phase 3 — Components

Fix:

* Buttons
* Inputs
* Cards
* Tables
* Navigation
* Modals
* Tooltips

### Phase 4 — Interaction

Fix:

* Hover
* Focus
* Active
* Disabled
* Loading
* Error
* Selection

### Phase 5 — Responsive

Fix:

* Tablet
* Mobile
* Overflow
* Navigation
* Component transformations

### Phase 6 — Polish

Fix:

* Alignment
* Inconsistent spacing
* Typography inconsistencies
* Excessive visual noise
* Awkward whitespace
* Broken states

---

# 19. Visual QA

After implementation, inspect the rendered application rather than relying only on source code.

Check:

## Layout

* Alignment
* Spacing
* Container widths
* Overflow
* Visual hierarchy

## Typography

* Font consistency
* Font sizes
* Line heights
* Text wrapping
* Truncation

## Components

* Buttons
* Inputs
* Cards
* Tables
* Navigation
* Modals

## Interaction

* Hover
* Focus
* Active
* Disabled
* Loading
* Error
* Selection

## Responsive

Test:

* Desktop
* Tablet
* Mobile

## Technical

Check:

* Console errors
* Failed requests
* Missing assets
* Broken routes
* Framework warnings

Fix issues discovered during QA.

---

# 20. Decision Tree

Use the following decision process.

```text
Is the existing functionality correct?
│
├── No
│   └── Fix functionality only if it is directly relevant to the requested UI task.
│
└── Yes
    │
    ├── Is the layout unclear?
    │   └── Fix information architecture and hierarchy first.
    │
    ├── Is the visual system inconsistent?
    │   └── Establish shared design tokens/components.
    │
    ├── Is the interaction unclear?
    │   └── Improve states, labels, feedback, and affordances.
    │
    ├── Is the interface too dense?
    │   └── Improve grouping and hierarchy before removing information.
    │
    ├── Is the interface too empty?
    │   └── Improve information structure before adding decoration.
    │
    ├── Is mobile behavior poor?
    │   └── Redesign component behavior for smaller screens.
    │
    └── Is everything functional but visually weak?
        └── Apply typography, spacing, color, alignment, and polish.
```

---

# 21. Critical Constraints

Never:

* Remove existing functionality without explicit instruction.
* Change backend APIs unnecessarily.
* Replace working components without a reason.
* Introduce dependencies unnecessarily.
* Rewrite the entire frontend merely for visual improvement.
* Hide important information solely to make the UI cleaner.
* Add decoration without a UX purpose.

When uncertain, prefer the smallest change that produces a meaningful UX improvement.

---

# 22. Completion Criteria

Consider the task complete only when:

* Existing functionality still works.
* The visual hierarchy is clear.
* Components are consistent.
* Spacing is systematic.
* Typography is coherent.
* Primary actions are obvious.
* Interactive states are implemented.
* Loading/empty/error states are handled.
* Responsive behavior is acceptable.
* Accessibility basics are addressed.
* The interface does not look like a generic AI-generated template.
* The final UI feels intentionally designed for the specific product.
* Visual QA has been performed on the rendered application.

Final principle:

> Make the interface simpler, clearer, and more intentional — not merely more decorated.

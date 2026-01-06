# Design System - Kodemaker CRM

## Overview

This document defines the design system for Kodemaker CRM, ensuring consistency across the application. The system is built on Tailwind CSS and shadcn/ui components with a modern, minimalist aesthetic.

## Color Palette

### Primary Colors

- **Primary**: Modern teal-blue (`oklch(0.5 0.15 220)`)

  - Used for: Main actions, primary buttons, links, active states
  - Foreground: White (`oklch(0.985 0 0)`)

- **Secondary**: Soft gray-blue (`oklch(0.96 0.005 250)`)

  - Used for: Background colors, subtle backgrounds
  - Foreground: Dark gray-blue (`oklch(0.25 0.02 250)`)

- **Secondary Green**: Vibrant green (`oklch(0.55 0.15 150)`)

  - Used for: Active status badges, success states
  - Foreground: White (`oklch(0.985 0 0)`)

- **Tertiary**: Warm orange (`oklch(0.65 0.18 45)`)

  - Used for: In-progress status badges, warning states
  - Foreground: Dark text (`oklch(0.141 0.005 285.823)`)

- **Accent**: Vibrant teal (`oklch(0.92 0.02 200)`)
  - Used for: Highlights, hover states, accents, activity log badges
  - Foreground: Dark teal (`oklch(0.25 0.02 200)`)

### Semantic Colors

- **Destructive**: Modern red (`oklch(0.58 0.22 25)`)

  - Used for: Delete actions, errors, warnings
  - Foreground: White

- **Muted**: Light gray (`oklch(0.97 0.002 250)`)

  - Used for: Disabled states, subtle backgrounds
  - Foreground: Medium gray (`oklch(0.55 0.015 250)`)

- **Frist Warning**: Yellow (`hsl(45 95% 85%)`)

  - Used for: Approaching deadlines (0-2 days until due)
  - Intensity increases as deadline approaches
  - Note: Colors are hardcoded in `useDueBgStyle()` hook, not using CSS variables

- **Frist Overdue**: Red (`hsl(0 92% 70%)`)
  - Used for: Overdue items
  - Intensity increases up to 14 days overdue, then stays at max
  - Note: Colors are hardcoded in `useDueBgStyle()` hook, not using CSS variables

### Neutral Colors

- **Background**: Pure white (`oklch(1 0 0)`)
- **Foreground**: Near black (`oklch(0.141 0.005 285.823)`)
- **Border**: Light gray (`oklch(0.92 0.005 250)`)
- **Input**: Light gray (`oklch(0.92 0.005 250)`)
- **Ring**: Primary color for focus states (`oklch(0.5 0.15 220)`)

### Chart Colors

- Chart 1: Teal-blue (`oklch(0.65 0.2 220)`)
- Chart 2: Blue-green (`oklch(0.6 0.15 180)`)
- Chart 3: Green (`oklch(0.55 0.12 140)`)
- Chart 4: Purple (`oklch(0.7 0.15 260)`)
- Chart 5: Magenta (`oklch(0.65 0.15 300)`)

### Dark Mode

Dark mode color definitions exist in `globals.css` but are not currently actively used or supported in the application. The application currently runs in light mode only.

## Typography

### Font Family

- **Primary**: Inter (Google Fonts)
  - Clean, modern sans-serif
  - Excellent readability at all sizes
  - Good support for Norwegian characters

### Font Scale

- **xs**: 0.75rem (12px) - Small labels, badges
- **sm**: 0.875rem (14px) - Body text, form labels
- **base**: 1rem (16px) - Default body text
- **lg**: 1.125rem (18px) - Large buttons, emphasized text
- **xl**: 1.25rem (20px) - Section headings
- **2xl**: 1.5rem (24px) - Page titles

### Font Weights

- **400**: Regular (default)
- **500**: Medium (buttons, labels)
- **600**: Semibold (headings)

### Heading Hierarchy

Use semantic HTML heading elements with consistent styling:

- **h1** (`text-2xl font-semibold`): Page titles, main headings
- **h2** (`text-lg font-medium`): Section headings within a page
- **h3** (`text-base font-semibold`): Sub-section headings within cards or sections

```tsx
// Page title
<h1 className="text-2xl font-semibold">Organisasjoner</h1>

// Section heading
<h2 className="text-lg font-medium mb-4">Aktivitetslogg</h2>

// Sub-section heading
<h3 className="text-base font-semibold mb-3">Siste nytt</h3>
```

**Guidelines**:

- Maintain semantic hierarchy (h1 > h2 > h3)
- Use `font-semibold` (600) for h1 and h3, `font-medium` (500) for h2
- Avoid colons after headings - they should stand alone
- Use appropriate bottom margins: `mb-4` for h2, `mb-3` for h3

## Button System

### Variants

1. **Primary** (`variant="default"`)

   - Main actions (Save, Submit, Create)
   - Uses primary color
   - High contrast for visibility

2. **Secondary** (`variant="secondary"`)

   - Secondary actions (Cancel, Back)
   - Uses secondary color
   - Medium contrast

3. **Outline** (`variant="outline"`)

   - Tertiary actions, less important buttons
   - Border with transparent background
   - Hover fills with accent color

4. **Ghost** (`variant="ghost"`)

   - Subtle actions, icon buttons
   - No background, hover only
   - Lowest visual weight

5. **Destructive** (`variant="destructive"`)

   - Delete, remove actions
   - Uses destructive color
   - Clear warning indication

6. **Link** (`variant="link"`)
   - Text links, navigation
   - Underlined on hover
   - Uses primary color

### Sizes

- **sm**: `h-8` - Compact buttons
- **default**: `h-9` - Standard buttons
- **lg**: `h-10` - Prominent buttons
- **icon**: `size-9` - Square icon buttons

### Usage Guidelines

- Use Primary for the main action on a page
- Use Secondary for alternative actions
- Use Outline for less important actions
- Use Ghost for toolbar actions
- Use Destructive sparingly for destructive actions
- Use Link for navigation and text links

## Badge System

### Variants

All badge variants use low-opacity backgrounds (10-20%) with matching text colors for better contrast and readability:

- **default**: Primary color (`bg-primary/10 text-primary`) - Used for "Ny" status
- **primary**: Chart 2 turquoise (`bg-chart-2/20 text-chart-2`) - Used for "Vunnet" status
- **secondary**: Secondary green (`bg-secondary-green/10 text-secondary-green`) - Used for "Aktiv lead"
- **tertiary**: Tertiary orange (`bg-tertiary/20 text-tertiary`) - Used for "Under arbeid" status
- **destructive**: Destructive red (`bg-destructive/10 text-destructive`) - Used for "Tapt" status
- **outline**: Border only, transparent background
- **bortfalt**: Muted color (`bg-muted/60 text-muted-foreground`) - Used for "Bortfalt" status

### Status Colors (Lead Badges)

- **NEW**: `variant="default"` (primary color)
- **IN_PROGRESS**: `variant="tertiary"` (orange)
- **WON**: `variant="primary"` (chart-2/turquoise)
- **LOST**: `variant="destructive"` (red)
- **BORTFALT**: `variant="bortfalt"` (muted)
- **Aktiv lead**: `variant="secondary"` (green)

### Activity Log Badges

- **Oppfølging**: `variant="secondary"` (green)
- **Kommentar**: `variant="default"` (primary, no variant specified)
- **E-post**: `variant="primary"` (turquoise)

## Spacing Scale

Using Tailwind's default spacing scale:

- **1**: 0.25rem (4px)
- **2**: 0.5rem (8px)
- **3**: 0.75rem (12px)
- **4**: 1rem (16px)
- **6**: 1.5rem (24px)
- **8**: 2rem (32px)
- **12**: 3rem (48px)

## Border Radius

- **sm**: `calc(var(--radius) - 4px)` - Small elements
- **md**: `calc(var(--radius) - 2px)` - Medium elements
- **lg**: `var(--radius)` (0.625rem) - Default
- **xl**: `calc(var(--radius) + 4px)` - Large elements

## Component Patterns

### Cards

- White background (`bg-card`)
- Border (`border`)
- Padding: `p-4` or `p-6`
- Rounded corners (`rounded-lg`)

### Forms

- Labels: `text-sm font-medium`
- Inputs: `h-10`, border, rounded-md
- Error states: Use destructive color
- Focus: Ring with primary color

### Navigation

- Header: Primary color background
- Sidebar: Light background with subtle borders
- Active state: Primary color
- Hover: Accent background

## Accessibility

- All colors meet WCAG AA contrast ratios
- Focus states clearly visible (ring with primary color)
- Interactive elements have hover states
- Disabled states use muted colors
- Semantic HTML used throughout

## Dark Mode

Dark mode color definitions exist in `globals.css` but are not currently actively used or supported in the application. The application currently runs in light mode only.

## Usage Examples

### Primary Button

```tsx
<Button>Save</Button>
```

### Secondary Button

```tsx
<Button variant="secondary">Cancel</Button>
```

### Outline Button

```tsx
<Button variant="outline">Back</Button>
```

### Status Badge

```tsx
<Badge variant="secondary">Active</Badge>
```

## Design Tokens

All design tokens are defined in `src/app/globals.css` using CSS variables. Use Tailwind utility classes that reference these variables rather than hardcoding colors.

### Common Patterns

- Background: `bg-background`
- Text: `text-foreground`
- Muted text: `text-muted-foreground`
- Borders: `border-border`
- Primary: `bg-primary text-primary-foreground`
- Secondary: `bg-secondary text-secondary-foreground`
- Accent: `bg-accent text-accent-foreground`

## Best Practices

1. **Always use design tokens** - Never hardcode colors like `#1a73e8` or `text-gray-400`
2. **Consistent spacing** - Use the spacing scale consistently
3. **Button hierarchy** - Follow the primary/secondary/tertiary pattern
4. **Accessibility first** - Ensure proper contrast and focus states
5. **Dark mode** - Test all components in both light and dark modes

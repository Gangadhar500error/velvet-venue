# Admin Dashboard Component Library

## Color Tokens

### Primary Colors
- **Accent**: `#0092ff` (Blue)
  - Used for: Active states, CTAs, badges, focus rings
  - Dark mode: `#0092ff` (no change)

### Neutral Colors

#### Light Mode
- **Background**: `#ffffff` (white)
- **Surface**: `#f9fafb` (gray-50)
- **Border**: `#e5e7eb` (gray-200)
- **Text Primary**: `#111827` (gray-900)
- **Text Secondary**: `#6b7280` (gray-600)
- **Text Tertiary**: `#9ca3af` (gray-400)
- **Hover**: `#f3f4f6` (gray-100)

#### Dark Mode
- **Background**: `#030712` (gray-950)
- **Surface**: `#111827` (gray-900)
- **Border**: `#1f2937` (gray-800)
- **Text Primary**: `#f9fafb` (gray-100)
- **Text Secondary**: `#d1d5db` (gray-400)
- **Text Tertiary**: `#6b7280` (gray-500)
- **Hover**: `#1f2937` (gray-800)

### Status Colors
- **Success**: `bg-green-100 text-green-800` / `bg-green-900/30 text-green-400`
- **Warning**: `bg-yellow-100 text-yellow-800` / `bg-yellow-900/30 text-yellow-400`
- **Info**: `bg-blue-100 text-blue-800` / `bg-blue-900/30 text-blue-400`
- **Error**: `bg-red-100 text-red-800` / `bg-red-900/30 text-red-400`

## Typography

### Font Families
- **Headings (h1-h6)**: `Romana-Bold` - `var(--font-romana-bold)` or `var(--font-display)`
- **Body Text**: `Apercu-Regular` - `var(--font-apercu-regular)` or `var(--font-sans)`
- **CSS Variables**:
  - `--font-romana-bold`: Used for all headings
  - `--font-apercu-regular`: Used for paragraphs, spans, divs, buttons, inputs, and all other text elements

### Font Sizes
- **Base**: `14px` (0.875rem)
- **Body**: `16px` (1rem)
- **Small**: `14px` (0.875rem)
- **Large**: `18px` (1.125rem)
- **Heading 1**: `24px` (1.5rem) - `text-2xl`
- **Heading 2**: `20px` (1.25rem) - `text-xl`
- **Heading 3**: `18px` (1.125rem) - `text-lg`

### Font Weights
- **Regular**: `400`
- **Medium**: `500` - `font-medium`
- **Semibold**: `600` - `font-semibold`
- **Bold**: `700` - `font-bold`

## Spacing

### Standard Scale (Tailwind)
- **xs**: `4px` (0.25rem)
- **sm**: `8px` (0.5rem)
- **md**: `16px` (1rem)
- **lg**: `24px` (1.5rem)
- **xl**: `32px` (2rem)
- **2xl**: `48px` (3rem)

### Component Spacing
- **Card Padding**: `24px` (p-6)
- **Section Gap**: `24px` (gap-6)
- **Navbar Height**: `64px` (h-16)
- **Input Padding**: `8px 12px` (px-3 py-2)
- **Button Padding**: `8px 16px` (px-4 py-2)

## Components

### 1. AdminSidebar

**Location**: `src/app/admin/_components/AdminSidebar.tsx`

**Features**:
- Fixed height, 20% width on desktop, collapsible to 72px icon-only
- Mobile: off-canvas drawer with overlay
- Logo with brand name
- Vertical navigation with icons and labels
- Nested/collapsible menu items
- Active state with blue accent bar
- Tooltips on hover when collapsed
- Badge support for notifications

**Responsive Breakpoints**:
- `lg:` (1024px+): Full sidebar visible, collapse toggle available
- Default (<1024px): Hidden by default, toggle opens off-canvas drawer

**Key Classes**:
```tsx
// Container
"fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800"

// Width states
"w-[20%] min-w-[250px]" // Expanded
"w-[72px]" // Collapsed

// Mobile states
"-translate-x-full" // Hidden
"translate-x-0" // Visible

// Nav item active
"bg-[#0092ff]/10 text-[#0092ff]"

// Transition
"transition-all duration-250 ease-out"
```

### 2. AdminNavbar

**Location**: `src/app/admin/_components/AdminNavbar.tsx`

**Features**:
- Fixed height 64px
- Hamburger menu toggle (mobile)
- Page title with search toggle
- Theme toggle (light/dark)
- Notification bell with badge count
- User profile dropdown
- Shadow on bottom border

**Key Classes**:
```tsx
// Container
"h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 shadow-sm"

// Buttons
"p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
```

### 3. Dropdown

**Location**: `src/app/admin/_components/AdminNavbar.tsx` (inline component)

**Features**:
- Absolute positioned
- Click outside to close
- Escape key to close
- Rounded corners with shadow
- Dark mode support

**Key Classes**:
```tsx
"absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
```

### 4. Notification Dropdown

**Location**: `src/app/admin/_components/AdminNavbar.tsx`

**Features**:
- Header with count badge
- Scrollable list (max-height 96)
- Unread items highlighted
- Each notification shows:
  - Blue dot indicator
  - Title
  - Message
  - Timestamp
- "View all" footer link
- Keyboard accessible

**Key Classes**:
```tsx
// Unread highlight
"bg-blue-50/30 dark:bg-blue-900/10"

// Scroll container
"max-h-96 overflow-y-auto"
```

### 5. Profile Dropdown

**Location**: `src/app/admin/_components/AdminNavbar.tsx`

**Features**:
- User info header (name and email)
- Menu items with icons
- Divider before logout
- Hover states
- Keyboard accessible

**Structure**:
```tsx
- Header: Name + Email
- Items: Profile, Settings, Help & Support
- Divider
- Logout
```

### 6. ThemeProvider

**Location**: `src/app/admin/_components/ThemeProvider.tsx`

**Features**:
- localStorage persistence
- System preference detection
- React Context API
- Smooth theme transitions

**Usage**:
```tsx
import { useTheme } from "./ThemeProvider";

const { theme, toggleTheme } = useTheme();
```

## Icons

**Source**: `lucide-react`

**Sizes**:
- Nav items: `w-6 h-6` (24px)
- Inline actions: `w-5 h-5` (20px)
- Small indicators: `w-4 h-4` (16px)

## Shadow & Borders

### Shadows
- **Card**: `shadow-sm` (hover: `shadow-md`)
- **Dropdown**: `shadow-lg`
- **Tooltip**: `shadow-lg`

### Border Radius
- **Cards**: `rounded-lg` (8px)
- **Buttons**: `rounded-lg` (8px)
- **Badges**: `rounded-full`
- **Inputs**: `rounded-lg` (8px)

## Animations

### Durations
- **Standard**: `200ms` - `duration-200`
- **Sidebar**: `250ms` - `duration-250`
- **Theme**: `300ms` - (via CSS transition-colors)

### Easing
- **Standard**: `ease-out`
- **Dropdown**: Instant show/hide with opacity transition

## Accessibility

### Focus States
```css
button:focus-visible,
a:focus-visible {
  outline: 2px solid #0092ff;
  outline-offset: 2px;
}
```

### ARIA Labels
- Toggle buttons: `aria-label="Toggle sidebar"`
- Icons: `aria-label="Notifications"`, etc.
- Nav items: `aria-label={item.label}`

### Keyboard Navigation
- Tab navigation through all interactive elements
- Enter/Space for button activation
- Escape to close dropdowns
- Arrow keys for nested navigation (can be enhanced)

### Contrast Ratios
- All text meets WCAG AA standard (≥ 4.5:1)
- Badge contrast: Bright colors on dark backgrounds
- Focus rings: Blue (#0092ff) on any background

## Responsive Breakpoints

Based on Tailwind defaults:
- **sm**: 640px
- **md**: 768px (tablet start)
- **lg**: 1024px (desktop start)
- **xl**: 1280px
- **2xl**: 1536px

## Usage Examples

### Basic Layout Structure
```tsx
<ThemeProvider>
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
    <AdminSidebar {...props} />
    <div className="flex-1 flex flex-col">
      <AdminNavbar {...props} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page content */}
        </div>
      </main>
    </div>
  </div>
</ThemeProvider>
```

### Card Component
```tsx
<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
  {/* Card content */}
</div>
```

### Data Table
```tsx
<div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
  <div className="p-6 border-b border-gray-200 dark:border-gray-800">
    <h2 className="text-lg font-semibold">Table Title</h2>
  </div>
  <table className="w-full">
    <thead className="bg-gray-50 dark:bg-gray-800">
      {/* Headers */}
    </thead>
    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
      {/* Rows */}
    </tbody>
  </table>
</div>
```


# Visual Audit: Current Site vs kobonz.site

## CRITICAL FINDINGS

### ✅ Good News
The original kobonz.site CSS files are already in the project:
- `public/index.css` - Contains ALL original colors, fonts, buttons, cards
- `public/homepage-premium.css` - Homepage hero, sections
- Other enhancement CSS files

### ❌ The Problem
**Tailwind CSS is OVERRIDING the original kobonz.site styles**

## Root Cause Analysis

### 1. **COLOR MISMATCH**
**Original kobonz.site colors (from index.css):**
```css
--brand-primary: #bf0000;      /* Red */
--brand-secondary: #9c88ff;    /* Purple */
--brand-accent: #ff9f73;       /* Orange */
--brand-purple: #a8a8ff;       /* Light purple */
```

**Current Tailwind colors (from tailwind.config.ts):**
```css
--primary: 221.2 83.2% 53.3%;  /* Blue - WRONG! */
--secondary: 210 40% 96.1%;    /* Light gray - WRONG! */
```

### 2. **BUTTON STYLE CONFLICT**
**Original kobonz.site (index.css lines 88-154):**
- Purple gradient background
- Rounded corners (1.25rem)
- Shimmer effect on hover
- Bounce animation
- Specific padding: 1rem 2.5rem

**Current implementation:**
- Tailwind's `btn-primary` class applies blue colors
- Missing shimmer effect
- Missing original padding

### 3. **CSS SPECIFICITY ISSUE**
The order in globals.css:
```css
@tailwind base;      /* Loads first */
@tailwind components;
@tailwind utilities;
@import url('/index.css');  /* Loads last BUT lower specificity */
```

Tailwind utilities have higher specificity, so they override index.css!

## EXACT DIFFERENCES IDENTIFIED

### Header
- ❌ Logo color: Should be gradient red-to-purple, currently purple-to-blue
- ❌ Nav link hover: Should be --brand-primary (#bf0000), currently blue
- ❌ Register button: Should use original .btn-primary styles

### Homepage Hero
- ❌ Background: Should use homepage-hero class with specific gradient
- ❌ Badge: Should have specific styling from homepage-premium.css
- ❌ Buttons: Missing original btn-primary/btn-secondary styling

### Cards
- ❌ Should use .enhanced-card or .enhanced-card-subtle classes
- ❌ Missing glass effect (backdrop-filter)
- ❌ Missing hover animations (translateY + scale)

### Typography
- ❌ Font weights and sizes don't match original
- ❌ Line heights different

### Spacing
- ❌ Padding/margins using Tailwind defaults instead of original values

## FIX STRATEGY

### Option 1: Override Tailwind Colors (RECOMMENDED)
Update `tailwind.config.ts` and `globals.css` to use kobonz.site colors

### Option 2: Increase CSS Specificity
Make index.css styles more specific with !important or higher specificity selectors

### Option 3: Remove Tailwind Conflicts
Only use Tailwind for layout, use original classes for components

## I WILL IMPLEMENT: Option 1 + Option 3 Hybrid
1. Update Tailwind config to match kobonz.site brand colors
2. Ensure all buttons/cards use original class names from index.css
3. Fix component markup to match original structure
4. Test pixel-perfect match

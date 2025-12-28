# rydAI Brand Guidelines

## Brand Philosophy

**rydAI** represents the convergence of artificial intelligence and seamless travel experiences. The brand embodies sophistication, trust, and the effortless nature of AI-powered assistance.

### Brand Values
- **Intelligence**: Powered by cutting-edge AI
- **Elegance**: Premium, refined aesthetic
- **Trust**: Reliable, secure, dependable
- **Fluidity**: Smooth, seamless experiences
- **Innovation**: Forward-thinking technology

---

## Logo Concept

### Primary Logo: "Neural Compass"

The rydAI logo combines two key elements:
1. **The "R" Monogram**: A stylized, geometric "R" that suggests movement and direction
2. **AI Neural Network**: Subtle dots/nodes integrated into the design representing AI connectivity

### Logo Variations
- **Primary**: Full "rydAI" wordmark with icon
- **Icon Only**: Compact "R" symbol for app icons
- **Horizontal**: Logo with tagline
- **Monochrome**: Single color versions

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Midnight Navy** | `#0A0E17` | 10, 14, 23 | Primary background |
| **Electric Blue** | `#3B82F6` | 59, 130, 246 | Primary accent, CTAs |
| **Cosmic Purple** | `#8B5CF6` | 139, 92, 246 | AI/Intelligence accents |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Aurora Cyan** | `#06B6D4` | 6, 182, 212 | Success states, highlights |
| **Ember Gold** | `#F59E0B` | 245, 158, 11 | Warnings, premium features |
| **Jade Green** | `#10B981` | 16, 185, 129 | Success, confirmations |
| **Rose Red** | `#EF4444` | 239, 68, 68 | Errors, alerts |

### Gradient System

```
Primary Gradient: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)
AI Glow Gradient: linear-gradient(135deg, #06B6D4 0%, #3B82F6 50%, #8B5CF6 100%)
Premium Gradient: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)
Dark Gradient: linear-gradient(180deg, #0A0E17 0%, #141821 100%)
```

---

## Typography

### Primary Typeface: SF Pro Display (iOS) / Roboto (Android)

| Style | Weight | Size | Line Height | Usage |
|-------|--------|------|-------------|-------|
| **Display** | Bold | 36px | 1.2 | Hero headlines |
| **Title 1** | Semibold | 28px | 1.3 | Section titles |
| **Title 2** | Semibold | 22px | 1.35 | Card headers |
| **Title 3** | Medium | 18px | 1.4 | Subsections |
| **Body** | Regular | 16px | 1.5 | Body text |
| **Caption** | Regular | 14px | 1.5 | Secondary text |
| **Small** | Regular | 12px | 1.4 | Labels, metadata |

### Logo Typography
- **"ryd"**: Custom geometric sans-serif, lowercase
- **"AI"**: Same typeface, uppercase, slightly reduced size

---

## App Icon Specifications

### iOS App Icon (1024x1024)
- Rounded corners applied by system
- No transparency
- Full bleed design

### Android Adaptive Icon
- Foreground: 108dp (transparent background)
- Background: Solid gradient or color
- Safe zone: 66dp centered

### Icon Design
The app icon features:
1. Deep midnight navy background (#0A0E17)
2. Centered "R" monogram with gradient fill (Electric Blue → Cosmic Purple)
3. Subtle neural network nodes in the background
4. Soft outer glow effect

---

## Iconography Style

### Characteristics
- **Weight**: 1.5px stroke
- **Corners**: 2px radius
- **Size**: 24x24 base grid
- **Style**: Outlined with selective fills

### Icon Categories
- **Navigation**: Home, Search, Profile, Settings
- **Actions**: Book, Cancel, Edit, Share
- **Status**: Success, Warning, Error, Info
- **Transport**: Flight, Ride, Train, Ship
- **AI**: Brain, Sparkles, Wand, Network

---

## Motion & Animation

### Timing Functions
- **Standard**: `ease-out` (0.0, 0.0, 0.2, 1.0)
- **Decelerate**: `ease-out` (0.0, 0.0, 0.2, 1.0)
- **Accelerate**: `ease-in` (0.4, 0.0, 1.0, 1.0)
- **Sharp**: `ease-in-out` (0.4, 0.0, 0.6, 1.0)

### Duration Scale
- **Micro**: 100ms (toggles, small interactions)
- **Fast**: 200ms (standard transitions)
- **Normal**: 300ms (modals, page transitions)
- **Slow**: 400ms (complex animations)
- **Slower**: 500ms (dramatic reveals)

### Signature Animations
1. **AI Pulse**: Concentric rings emanating from center
2. **Neural Connect**: Dots connecting with glowing lines
3. **Route Draw**: Animated path from origin to destination
4. **Success Burst**: Radial particle explosion

---

## Voice & Tone

### Personality
- **Intelligent**: Knowledgeable without being condescending
- **Confident**: Assured but not arrogant
- **Friendly**: Warm but professional
- **Efficient**: Clear, concise communication

### Example Copy
- Greeting: "Ready when you are."
- Processing: "Finding your perfect option..."
- Success: "Booked. You're all set."
- Error: "Let's try that again."

---

## Spacing System

Based on 4px grid:

| Name | Value | Usage |
|------|-------|-------|
| `xs` | 4px | Tight spacing |
| `sm` | 8px | Icon padding |
| `md` | 12px | Component gaps |
| `lg` | 16px | Section spacing |
| `xl` | 24px | Major sections |
| `2xl` | 32px | Page margins |
| `3xl` | 48px | Hero spacing |
| `4xl` | 64px | Major divisions |

---

## Shadow System

### Elevation Levels

```css
/* Level 1 - Cards */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.18)

/* Level 2 - Dropdowns */
shadow-md: 0 2px 8px rgba(0, 0, 0, 0.23)

/* Level 3 - Modals */
shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.30)

/* Level 4 - Dialogs */
shadow-xl: 0 6px 24px rgba(0, 0, 0, 0.37)
```

### Glow Effects (for AI elements)
```css
glow-blue: 0 0 20px rgba(59, 130, 246, 0.4)
glow-purple: 0 0 20px rgba(139, 92, 246, 0.4)
glow-cyan: 0 0 20px rgba(6, 182, 212, 0.4)
```

---

## Border Radius

| Name | Value | Usage |
|------|-------|-------|
| `sm` | 6px | Buttons, inputs |
| `md` | 10px | Cards, chips |
| `lg` | 14px | Large cards |
| `xl` | 20px | Modals, bottom sheets |
| `full` | 9999px | Pills, avatars |

---

## Usage Guidelines

### Do's
- Use the primary gradient for main CTAs
- Maintain contrast ratios (WCAG AA minimum)
- Use consistent spacing from the system
- Apply animations thoughtfully
- Keep the AI aesthetic subtle, not overwhelming

### Don'ts
- Don't stretch or distort the logo
- Don't use colors outside the palette
- Don't mix typefaces arbitrarily
- Don't overuse glow effects
- Don't animate everything - be selective

---

## File Formats

### Logo Files
- SVG (vector, web)
- PNG (raster, multiple sizes)
- PDF (print)

### App Icons
- PNG (iOS: 1024x1024)
- PNG (Android: 512x512 + adaptive layers)

### Other Assets
- SVG for illustrations
- Lottie for complex animations
- WebP for optimized images

---

*rydAI Brand Guidelines v1.0*
*Last Updated: December 2024*

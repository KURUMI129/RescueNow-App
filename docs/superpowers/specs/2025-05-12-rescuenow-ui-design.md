# RescueNow UI/UX Design Spec
**Date:** 2025-05-12
**Type:** Design System Refresh
**Status:** Draft

## Concept & Vision

RescueNow es una app de emergencia que inspira confianza y profesionalismo. El diseño glassmorphism existente se refina para maximizar accesibilidad, jerarquía visual clara, y reconocimiento inmediato de funciones críticas como el botón SOS. La personalidad es: **moderna, confiable, urgente sin ser alarmante**.

## Design Language

### Aesthetic Direction
Glassmorphism refinado con énfasis en:
- Profundidad mediante capas (background blur → surface → elevated elements)
- Contraste WCAG AAA para legibilidad crítica
- Animaciones sutiles que comunican estado sin distraer
- Consistencia en radio de bordes (12px cards, 8px buttons, 24px modals)

### Color Palette

```
Dark Mode:
- Primary:      #DC2626 (Rojo emergencia)
- Secondary:    #0EA5E9 (Azul médico)
- Success:      #22C55E (Verde confirmación)
- Warning:      #F59E0B (Amarillo alerta)
- Background:   #0F172A (Slate oscuro)
- Surface:      rgba(30, 41, 59, 0.85)
- Surface Elevated: rgba(51, 65, 85, 0.90)
- Border:       rgba(148, 163, 184, 0.2)
- Text Primary:  #F8FAFC
- Text Secondary: #94A3B8
- Text Muted:   #64748B

Light Mode:
- Background:   #F8FAFC
- Surface:      rgba(255, 255, 255, 0.85)
- Surface Elevated: rgba(255, 255, 255, 0.95)
- Border:       rgba(148, 163, 184, 0.3)
- Text Primary:  #0F172A
- Text Secondary: #475569
- Text Muted:   #94A3B8
```

### Typography

```
Scale (modular, ratio 1.25):
- Display:  32px / 700 weight / -0.02em tracking (títulos principales)
- H1:       28px / 600 weight / -0.01em
- H2:       24px / 600 weight
- H3:       20px / 600 weight
- Body:     16px / 400 weight / 1.5 line-height
- Caption:  14px / 400 weight
- Small:    12px / 500 weight / uppercase / 0.05em tracking (labels)

Font Family:
- Primary:  System font stack (iOS: SF Pro, Android: Roboto)
- Mono:     Platform monospace (código, datos médicos)
```

### Spacing System

```
Base unit: 4px
- xs:  4px
- sm:  8px
- md:  16px
- lg:  24px
- xl:  32px
- 2xl: 48px
- 3xl: 64px
```

### Motion Philosophy

```
Durations:
- Micro (hover, press):    150ms
- Standard (transitions):  300ms
- Emphasis (modals, sos):  500ms

Easing:
- Default:  cubic-bezier(0.4, 0, 0.2, 1)  (ease-out)
- Bounce:   cubic-bezier(0.34, 1.56, 0.64, 1) (spring)
- Smooth:   cubic-bezier(0.25, 0.1, 0.25, 1)

Key Animations:
- SOS Button: pulse (scale 1 → 1.05 → 1, infinite, 2s)
- Card press: scale 0.98 + shadow reduction
- Screen transitions: slide + fade, 300ms
- Toast: slide-up + fade, 300ms
```

### Visual Assets

```
Icons: @expo/vector-icons
- Primary: Ionicons (outline style, 24px default)
- Emergency: MaterialCommunityIcons (filled, rojo)

Glass Effect Specs:
- Blur: 20 (background elements), 30 (elevated)
- Opacity: 0.85 (surface), 0.95 (elevated)
- Border: 1px solid rgba(255,255,255,0.1) (dark), rgba(0,0,0,0.05) (light)
- Border radius: inherit from element
```

## Component Inventory

### 1. Button

```
Variants:
- Primary: bg #DC2626, text white, hover: brightness 110%
- Secondary: bg transparent, border #0EA5E9, text #0EA5E9
- Ghost: bg transparent, text primary
- Danger: bg #DC2626 at 10% opacity, text #DC2626

States:
- Default: según variant
- Pressed: scale 0.97, 150ms
- Disabled: opacity 0.5, cursor default
- Loading: spinner replacing text

Sizes:
- sm: height 36px, padding-h 12px, text 14px
- md: height 44px, padding-h 16px, text 16px
- lg: height 52px, padding-h 24px, text 18px
- sos: height 72px, min-width 72px, circular, shadow-xl
```

### 2. Card

```
Base:
- bg: surface color con blur
- border: 1px solid border color
- border-radius: 12px
- padding: 16px
- shadow: 0 4px 6px -1px rgba(0,0,0,0.1)

Variants:
- Elevated: shadow-lg, border-radius 16px
- Interactive: hover scale 1.02, press scale 0.98
- Service Card: icon left, title + subtitle, chevron right
```

### 3. Input

```
Base:
- height: 48px
- bg: surface elevated
- border: 1px solid border color
- border-radius: 8px
- padding: 0 16px

States:
- Default: border standard
- Focus: border #0EA5E9, ring 2px #0EA5E9/20%
- Error: border #DC2626, ring 2px #DC2626/20%
- Disabled: bg muted, opacity 0.6

Variants:
- With icon: icon left, 16px padding-left
- Multiline: min-height 100px, padding 12px
```

### 4. Header (Glass)

```
- height: 60px + safe area top
- bg: surface con blur 30
- border-bottom: 1px solid border
- content: title centered, optional left/right icons
```

### 5. SOS Button

```
Position: fixed bottom-right, 24px margin
Size: 72px circular
Animation:
  - Idle: subtle pulse (scale 1 → 1.05, 2s loop)
  - Active: faster pulse + red glow ring
  - Pressed: scale 0.95, haptic feedback

States:
- Default: bg #DC2626, icon white shield
- Pressed: bg darker, scale 0.95
- Emergency active: expanding ring animation
```

### 6. Bottom Sheet

```
- bg: surface elevated
- border-top-radius: 24px
- handle bar: 40px × 4px, centered, muted color
- max-height: 85vh
- animation: spring bounce on open
```

### 7. Toast

```
- position: top, 60px from safe area
- bg: surface elevated
- border-radius: 8px
- icon left (type-based)
- auto-dismiss: 4s
- animation: slide-down + fade
```

## Screen-Specific Guidelines

### Auth Screens (Login, Register, Forgot Password)

```
Layout: centered content, 24px horizontal padding
- Logo: centered, 80px height
- Title: display size, primary color
- Form: full width, 16px gap between fields
- CTA Button: full width, lg size
- Links: centered, ghost style
- Background: gradient sutil (primary → background)
```

### Home Screen

```
Header: glass, 60px, título "RescueNow" izq
Map: fills remaining space, 0 opacity header on map
FAB Group: bottom-right, sos principal + secondary actions
Service Quick Access: horizontal scroll cards
```

### Services Screen

```
Grid: 2 columnas, 12px gap
Cards: icon top, título, descripción corta
Tap: navigation to service detail
```

### Chatbot (Rex)

```
Header: glass, "Rex" título, status indicator
Messages: bubbles, user izq (primary/10%), bot derecha (surface)
Input: pinned bottom, icon send
Suggested actions: chips above input
```

### Emergency Call Modal

```
Trigger: sos button long-press o tap
Overlay: bg rgba(0,0,0,0.7)
Content: card centered, countdown, cancel button
Animation: scale bounce in
```

## Accessibility Requirements

```
- All tap targets: minimum 44px
- Touch feedback: visual + haptic
- Color contrast: WCAG AA (4.5:1) minimum, AAA preferred
- Focus indicators: visible in all themes
- Screen reader: aria labels on icons, roles semánticos
- Reduced motion: respect prefers-reduced-motion
- Dynamic type: support iOS/Android text scaling
```

## Technical Approach

### Implementation

```
1. Create design tokens constants file
2. Extract reusable component functions
3. Update screens following component specs
4. Verify accessibility with device testing
```

### File Structure

```
constants/
  design-tokens.ts    # Colors, spacing, typography
  theme.ts           # Light/dark theme objects

components/
  ui/
    Button.tsx
    Card.tsx
    Input.tsx
    Header.tsx
    Toast.tsx
    BottomSheet.tsx
    SOSButton.tsx
```

## Verification Checklist

- [ ] All colors pass WCAG AA contrast
- [ ] Touch targets minimum 44px
- [ ] Animations respect reduced motion
- [ ] Dark/light modes visually consistent
- [ ] SOS button always visible y accesible
- [ ] No orphaned inline styles

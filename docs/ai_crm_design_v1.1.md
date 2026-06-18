# AI-CRM Design System v1.1 (Master)

**Project Name:** AI-CRM Design System v1.1  
**Status:** Final Updated (v1.1)  
**Date:** 2026-06-16

---

## 1. Project Index (Screens)
1.  **Login Page**: {{DATA:SCREEN:SCREEN_27}}
2.  **Dashboard**: {{DATA:SCREEN:SCREEN_33}} (v1.1 updated)
3.  **Contacts List**: {{DATA:SCREEN:SCREEN_22}} (v1.1 updated)
4.  **Contact Detail**: {{DATA:SCREEN:SCREEN_8}}
5.  **Contact Form**: {{DATA:SCREEN:SCREEN_21}}
6.  **Deals Pipeline (Kanban)**: {{DATA:SCREEN:SCREEN_32}}
    - *New Deal Drawer*: {{DATA:SCREEN:SCREEN_5}}
7.  **Activity Feed**: {{DATA:SCREEN:SCREEN_11}} (v1.1 updated)
    - *Log Activity Drawer*: {{DATA:SCREEN:SCREEN_25}}
8.  **Task List**: {{DATA:SCREEN:SCREEN_14}} (v1.1 updated)
    - *Task Form Drawer*: {{DATA:SCREEN:SCREEN_2}}
9.  **Users Management**: {{DATA:SCREEN:SCREEN_6}}
10. **Tags Management**: {{DATA:SCREEN:SCREEN_24}}
11. **Confirm Delete Modal**: {{DATA:SCREEN:SCREEN_26}}
12. **Component Reference Sheet**: {{DATA:SCREEN:SCREEN_19}}

---

## 2. Design Tokens (v1.1)

> **Source of truth:** `docs/DESIGN.md` §3. These tokens must be used verbatim
> in all CSS/theme configuration. Do not rename or invent new token names.

```css
:root {
  /* ── Colours ─────────────────────────────────────────────────── */
  --color-primary:         #4F46E5;  /* primary buttons, active nav, links */
  --color-primary-light:   #EEF2FF;  /* hover states, active backgrounds */
  --color-primary-dark:    #3730A3;  /* pressed states */
  --color-success:         #10B981;  /* Closed Won badge, completed tasks */
  --color-danger:          #EF4444;  /* Closed Lost badge, delete, errors */
  --color-warning:         #F59E0B;  /* overdue tasks, low-priority alerts */
  --color-info:            #3B82F6;  /* informational toasts, tooltips */
  --color-surface:         #FFFFFF;  /* card and modal backgrounds */
  --color-background:      #F8FAFC;  /* page background */
  --color-border:          #E2E8F0;  /* dividers, input borders */
  --color-text-primary:    #1E293B;  /* headings, labels */
  --color-text-secondary:  #64748B;  /* secondary text, timestamps */
  --color-text-disabled:   #CBD5E1;  /* disabled inputs, placeholder */
  --color-sidebar-bg:      #1E1B4B;  /* sidebar background (dark) */
  --color-sidebar-text:    #C7D2FE;  /* sidebar nav item text */
  --color-sidebar-active:  #4F46E5;  /* active sidebar item highlight */

  /* ── Typography ──────────────────────────────────────────────── */
  --font-family:           Inter, system-ui, sans-serif;
  --font-size-xs:          11px;  /* timestamps, badges */
  --font-size-sm:          13px;  /* table cells, secondary labels */
  --font-size-base:        14px;  /* body text, form inputs */
  --font-size-md:          16px;  /* card titles, section headings */
  --font-size-lg:          20px;  /* page titles */
  --font-size-xl:          24px;  /* dashboard metric numbers */
  --font-weight-normal:    400;   /* body text */
  --font-weight-medium:    500;   /* labels, nav items */
  --font-weight-semibold:  600;   /* page headings, card titles */
  --font-weight-bold:      700;   /* metric values */

  /* ── Spacing (8px grid) ──────────────────────────────────────── */
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;

  /* ── Border Radius ───────────────────────────────────────────── */
  --radius-sm:    4px;     /* badges, chips */
  --radius-md:    8px;     /* cards, inputs, buttons */
  --radius-lg:    12px;    /* modals, drawers */
  --radius-full:  9999px;  /* avatars, toggle pills */

  /* ── Elevation (Box Shadow) ──────────────────────────────────── */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08);   /* cards */
  --shadow-md:  0 4px 12px rgba(0,0,0,0.12);  /* dropdowns, tooltips */
  --shadow-lg:  0 8px 32px rgba(0,0,0,0.16);  /* modals */
}
```

---

## 3. Structural Fixes Applied
- **FIX 1**: Separate Activities and Tasks into distinct sections. Section 7 is now dedicated to Tasks (List + Drawer). Section 8 handles Admin (Users + Tags).
- **FIX 2**: Design Token Audit. All screens confirmed for Sidebar (#1E1B4B), Primary (#4F46E5), and Background (#F8FAFC).
- **NEW MODULES**: Integrated Task Form Drawer, Users Management, and Tags Management.

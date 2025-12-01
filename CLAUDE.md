# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blood Lines is an interactive 3D family tree visualizer built with React and Three.js. It parses GEDCOM files (genealogy data format) and renders them as a force-directed 3D graph where users can explore family relationships through time.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (opens in browser at http://0.0.0.0:8080)
npm start

# Build for production (outputs to dist/)
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Architecture

### Core Data Flow

1. **GEDCOM Parsing**: Raw `.ged` files are parsed using `gedcom-d3` library
   - `parse()` converts GEDCOM format to structured data
   - `d3ize()` transforms parsed data into d3-compatible node/link graph structure

2. **State Management**: All state lives in `index.js` App component and flows down through props
   - `d3Data`: The graph data structure (nodes and links)
   - `highlights`: Tracks selected node and its family connections
   - `highlightedFamily`: Surname-based filtering
   - `theme`: Light/dark mode toggle

3. **Component Hierarchy**:
   ```
   App (index.js)
   ├── ThemeToggle
   ├── Load (landing page)
   └── Graph + Controls (visualization view)
   ```

### Key Components

**index.js**
- Root application component
- Manages all state and data parsing
- Switches between Load and Graph+Controls views
- Contains theme detection and toggle logic

**Graph.js**
- Renders the 3D force-directed graph using `react-force-graph-3d`
- Uses Three.js for 3D scene, meshes, and sprites
- Implements node highlighting logic for family trees (ancestors, descendants, spouses)
- Builds timeline visualization with year labels
- Handles both desktop (mouse) and mobile (Hammer.js touch) interactions
- Node click builds complex family relationship graphs by iterating through ancestors and descendants

**Controls.js**
- UI overlay with info panels (legend, surnames, node details)
- Shows person information when node is clicked
- Provides surname filtering to highlight specific families
- Contains instructions for user interaction

**Load.js**
- Landing page for file upload and sample selection
- Handles GEDCOM file upload with validation
- Provides 13 pre-loaded sample family trees

### Data Structure

The `d3Data` object structure after parsing:
```javascript
{
  nodes: [
    {
      id: string,
      name: string,
      firstName: string,
      surname: string,
      yob: number,      // Year of birth
      yod: number,      // Year of death
      pob: string,      // Place of birth
      pod: string,      // Place of death
      gender: 'M'|'F',
      color: string,    // Family color
      fy: number,       // Fixed Y position (timeline)
      // ... other GEDCOM fields
    }
  ],
  links: [
    {
      source: nodeId,
      target: nodeId,
      sourceType: 'CHIL'|'HUSB'|'WIFE',
      targetType: 'CHIL'|'HUSB'|'WIFE',
      index: number
    }
  ],
  surnameList: [
    { surname: string, count: number, color: string }
  ]
}
```

### Theme System

The app uses CSS custom properties via `data-theme` attribute on `<body>`:
- Light mode: `data-theme="light"`
- Dark mode: `data-theme="dark"`

Theme colors are defined in Graph.js `themeColors` object and applied to:
- Node labels and backgrounds
- Link colors (romantic vs blood relationships)
- Timeline elements
- Background color

Romantic relationships (spouse links) are visually distinct from parent-child links.

### Force Graph Configuration

- Uses `d3-force-3d` for physics simulation
- Collision force with radius 55 prevents node overlap
- Nodes positioned on Y-axis by birth year (creating timeline)
- Damping and rotation speed configured for smooth interaction
- Directional particles flow from parents to children (shows lineage direction)

### Mobile vs Desktop Interactions

**Desktop:**
- Left-click drag: rotate camera
- Right-click drag: pan camera
- Mouse wheel: zoom
- Click node: highlight family tree

**Mobile:**
- Hammer.js for touch gesture recognition
- Single tap: select node
- Pinch: zoom
- Swipe: rotate
- Two-finger swipe: pan

### Highlighting Logic

When a node is clicked, the app calculates three relationship groups:
1. **Nuclear family**: Direct connections (parents, spouses, children)
2. **Ancestors**: Recursively walks upward through parent links
3. **Descendants**: Recursively walks downward through child links

All related nodes and connecting links are highlighted while others are muted.

## Important Implementation Details

- GEDCOM files must be imported at build time or uploaded by users
- The app uses Webpack's raw-loader for `.ged` files
- Three.js SpriteText is used for node labels (not HTML overlays)
- Node positions on Y-axis are fixed based on birth year to create chronological timeline
- The collision force is critical for readability - adjust radius in Graph.js:180 if needed
- Console logs for descendant line building are still active (Graph.js:446-450)
- Babel transpiles JSX and modern JavaScript features

## Styling

- Uses Sass (`.scss`) for styling
- Structure: `sass/base/`, `sass/components/`, `sass/mixins/`
- Styles are imported in index.js and injected by webpack style-loader
- Theme variables defined via CSS custom properties

## Sample Data

Pre-loaded GEDCOM files in `src/gedcoms/`:
- Historical figures: Kennedy, Shakespeare, Tudor, Bach, Washington
- Fictional: Tolkien, Potter, Halfling, Greek/Roman gods
- Celebrity: Kardashian
- Royal family
- Personal example: Plunkett

## Known Quirks

- Mobile touch handling uses a timeout to distinguish tap from pinch gestures
- The `justPinchedRef` prevents accidental node selection after pinching
- Node labels show "?" if firstName is unknown
- Timeline only shows if data spans sufficient years (>300, >450 for quarter marks)

# Blood Lines

**Blood Lines** is an interactive tool for visualizing family tree data in a 3D space. Upload your own GEDCOM files or explore famous family trees, and navigate complex genealogies with intuitive controls.

[![Live Demo](https://img.shields.io/badge/Demo-online-green)](https://blood-lines.ohkayblanket.com/)

---

## 🌐 Demo

👉 [Try Blood Lines Live](https://blood-lines.ohkayblanket.com/)

---

## ✨ Features

- **Interactive 3D Visualization**: Explore family trees in a dynamic, force-directed 3D graph.
- **GEDCOM Support**: Upload your own `.ged` files (the standard for genealogy data).
- **Sample Trees**: Instantly view famous or fictional family trees (Kennedy, Shakespeare, Tolkien, etc.).
- **Intuitive Controls**: Pan, zoom, and focus on individuals or families.
- **Highlighting & Filtering**: Focus on specific nodes and their direct relations.

---

<video src="path/to/output.mp4" controls width="600"></video>

[▶️ Watch Demo Video](src/video/demo-1080.mp4)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/mister-blanket/blood-lines.git blood-lines
cd blood-lines
npm install
```

### Running Locally

```bash
npm start
```

This will start a development server and open Blood Lines in your browser.

### Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

---

## 📂 Project Structure

- `src/`
  - `index.js` — Main React entry point
  - `Graph.js` — 3D force-directed graph logic
  - `Controls.js` — UI controls for navigation and filtering
  - `Load.js` — File upload and sample data loader
  - `gedcoms/` — Sample GEDCOM files
  - `img/` — Images, icons, and (add your screenshots/gifs here)
  - `sass/` — Styles (Sass)
- `webpack.config.js` — Build configuration
- `dist/` — Production build output

---

## 🕹️ Usage & Controls

### Uploading Your Own Data

- Click **"upload a gedcom (.ged) file"** and select your file.
- Only `.ged` files are supported (export from your genealogy software).

### Exploring Sample Trees

- Click any sample button (e.g., "kennedy", "shakespeare") to load a pre-included tree.

### Mouse & Node Controls

- **Left-click & drag**: Rotate the camera
- **Right-click & drag**: Pan the camera
- **Mouse wheel**: Zoom in/out
- **Left-click on node**: Highlight node and its direct relations
- **Right-click on node**: Zoom to node and set as camera pivot

### 📤 Exporting Your Family Tree as a GEDCOM (.ged) File

To visualize your own family tree, you need a GEDCOM (.ged) file. Most genealogy platforms allow you to export your data in this format. Here's how to do it on some popular platforms:

#### Ancestry.com

1. Go to your family tree.
2. Click on "Tree Settings" (top left menu).
3. Scroll down to the "Manage your tree" section.
4. Click "Export tree". A GEDCOM file will be generated for download.

#### MyHeritage

1. Open your family tree.
2. Click on the tree name (top left), then "Export to GEDCOM".
3. Follow the prompts to download your .ged file.

#### FamilySearch

FamilySearch does not allow direct GEDCOM export. You can use third-party tools or software (like RootsMagic or Ancestral Quest) to import your FamilySearch tree and then export as GEDCOM.

#### GRAMPS (Free & Open Source)

1. Open your family tree in GRAMPS.
2. Go to "Family Trees" > "Export..."
3. Choose "GEDCOM" as the export format and save your file.

#### Other Platforms

Most genealogy software and websites support GEDCOM export. Look for "Export" or "Download" options in your tree or account settings, and select GEDCOM as the format.

For more about GEDCOM, see the [Wikipedia article](https://en.wikipedia.org/wiki/GEDCOM).

---

## 🛠️ Technologies & Dependencies

- [React](https://reactjs.org/)
- [Three.js](https://threejs.org/)
- [3d-force-graph](https://github.com/vasturiano/3d-force-graph) ([MIT License](https://github.com/vasturiano/3d-force-graph/blob/master/LICENSE))
- [gedcom-d3](https://github.com/mister-blanket/gedcom-d3) (custom parser, based on [tmcw/parse-gedcom](https://github.com/tmcw/parse-gedcom))
- [d3-force-3d](https://github.com/vasturiano/d3-force-3d)
- [Webpack](https://webpack.js.org/)
- [Sass](https://sass-lang.com/)

---

## 🙏 Acknowledgments

- [tmcw/parse-gedcom](https://github.com/tmcw/parse-gedcom) — Simple, open-source GEDCOM parser
- [vasturiano/3d-force-graph](https://github.com/vasturiano/3d-force-graph) — 3D force-directed graph visualization

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests for bug fixes, new features, or improvements. Please be respectful and constructive in all communications.

---

## 📄 License

This project is licensed under the ISC License. See [LICENSE](LICENSE) for details.

---

## 📬 Contact

For questions or feedback, visit [ohkayblanket.com](https://ohkayblanket.com/) or open an issue on GitHub.

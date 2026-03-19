// Modules
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { parse, d3ize } from "gedcom-d3";

// Components
import Load from "./Load";
import Controls from "./Controls";
import Graph from "./Graph";
import EditPanel from "./EditPanel";

// Export utilities
import { downloadGedcom, downloadGedz, importGedz } from "./gedcomExport";

// Style
import "./sass/style.scss";

// GEDOM files
import halflingFile from "./gedcoms/halfling.ged";
import kennedyFile from "./gedcoms/kennedy.ged";
import shakespeareFile from "./gedcoms/shakespeare.ged";
import kardashianFile from "./gedcoms/kardashian.ged";
import bachFile from "./gedcoms/bach.ged";
import potterFile from "./gedcoms/potter.ged";
import royalFile from "./gedcoms/royal-family.ged";
import tolkienFile from "./gedcoms/tolkien.ged";
import washingtonFile from "./gedcoms/washington.ged";
import grekGodsFile from "./gedcoms/greek-gods.ged";
import romanGodsFile from "./gedcoms/roman-gods.ged";

// Generate a unique ID for new nodes
let nodeCounter = 0;
function generateNodeId() {
  nodeCounter++;
  return `INEW${Date.now()}${nodeCounter}`;
}

// Color palette for new nodes
const colorList = [
  "#f6edd0",
  "#f8a39e",
  "#5bceff",
  "#ffc32a",
  "#8df0c2",
  "#d0a8ec",
  "#ffa686",
  "#adcdd8",
  "#a6b890",
  "#e6f387",
  "#eebf90",
  "#6e90e6",
  "#f8a7d0",
  "#30f6d5",
  "#be719d",
  "#e08e79",
  "#80d152",
  "#9efde5",
  "#ff835a",
  "#eebd6e",
  "#35f8a0",
  "#f95162",
  "#d4ee5e",
  "#e887aa",
  "#a178ea",
  "#00c0de",
];
let colorIndex = 0;
function getNextColor() {
  const color = colorList[colorIndex % colorList.length];
  colorIndex++;
  return color;
}

// Rebuild surnameList from nodes
function rebuildSurnameList(nodes) {
  const surnameMap = {};
  // Collect a color palette from existing nodes
  const existingColors = {};
  nodes.forEach((node) => {
    if (node.surname && node.color) {
      existingColors[node.surname] = node.color;
    }
  });

  nodes.forEach((node) => {
    const surname = node.surname || "";
    if (!surnameMap[surname]) {
      surnameMap[surname] = {
        surname,
        count: 0,
        color: existingColors[surname] || "#ccc",
      };
    }
    surnameMap[surname].count++;
  });

  return Object.values(surnameMap);
}

const App = () => {
  const [showingRoots, setShowingRoots] = useState(false);
  const [d3Data, setD3Data] = useState([]);
  const [showError, setShowError] = useState(false);
  const [highlightedFamily, setHighlightedFamily] = useState();
  const [showingLegend, setShowingLegend] = useState(false);
  const [showingSurnames, setShowingSurnames] = useState(false);
  const [highlights, setHighlights] = useState({
    node: null,
    family: [],
    links: [],
  });
  const isMobile = window.innerWidth < 769;
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark",
  );
  const [nameFormat, setNameFormat] = useState(
    () => localStorage.getItem("nameFormat") || "firstLast",
  );

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [photoStore, setPhotoStore] = useState({});
  const [nodeVersion, setNodeVersion] = useState(0);
  const [hasEdits, setHasEdits] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);

  // Detect device color scheme on mount (only if no saved preference)
  useEffect(() => {
    if (!localStorage.getItem("theme")) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.matches) {
        setTheme("dark");
      } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    }
  }, []);

  // Set data-theme attribute on body and persist to localStorage
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Persist nameFormat to localStorage
  useEffect(() => {
    localStorage.setItem("nameFormat", nameFormat);
  }, [nameFormat]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Clear highlights
  const clearHighlights = () => {
    setHighlights({ node: null, family: [], links: [] });
    setHighlightedFamily(null);
    setShowingLegend(false);
    setShowingSurnames(false);
  };

  const readFile = (file) => {
    setD3Data(d3ize(parse(file)));
    setShowingRoots(true);
    setShowError(false);
    setPhotoStore({});
    setEditMode(false);
    setEditingNode(null);
    setHasEdits(false);
  };

  const closeRoots = () => {
    if (hasEdits) {
      setShowCloseWarning(true);
      return;
    }
    forceClose();
  };

  const forceClose = () => {
    clearHighlights();
    setShowingRoots(false);
    setD3Data([]);
    setEditMode(false);
    setEditingNode(null);
    setPhotoStore({});
    setHasEdits(false);
    setShowCloseWarning(false);
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const parts = file.name.split(".");
    const ext = parts[parts.length - 1].toLowerCase();

    if (ext === "ged") {
      const reader = new FileReader();
      reader.onloadend = () => {
        readFile(reader.result);
      };
      reader.readAsText(file);
    } else if (ext === "gedz") {
      try {
        const { gedcomText, photos } = await importGedz(file);
        if (gedcomText) {
          setD3Data(d3ize(parse(gedcomText)));
          setPhotoStore(photos || {});
          setShowingRoots(true);
          setShowError(false);
        } else {
          setShowError(true);
        }
      } catch (e) {
        console.error("Error importing .gedz:", e);
        setShowError(true);
      }
    } else {
      setShowError(true);
    }
  };

  // --- Data mutation functions ---

  const updateNode = (nodeId, updates) => {
    const node = d3Data.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const prevYob = node.yob;
    // Mutate in place to preserve force-graph internal properties (x, y, z, fy, etc.)
    Object.assign(node, updates);
    if (updates.firstName !== undefined || updates.surname !== undefined) {
      node.name = `${node.firstName || ""} ${node.surname || ""}`.trim();
    }
    if (updates.surname !== undefined) {
      const match = d3Data.nodes.find(
        (n) => n.id !== nodeId && n.surname === node.surname,
      );
      if (match) {
        node.color = match.color;
      } else {
        node.color = getNextColor();
      }
    }
    if (updates.yob !== undefined && Number(updates.yob) !== Number(prevYob)) {
      if (node.yob && prevYob && node.fy != null) {
        // Derive the fy-per-year scale from the existing timeline position
        // d3ize uses a complex formula (ratio + centering), so we calculate
        // the offset from the old position to preserve the timeline's scale
        const prevFy = node.fy;
        const yearDelta = Number(node.yob) - Number(prevYob);
        // Find the scale by comparing two known nodes with different yobs
        const refNodes = d3Data.nodes.filter(
          (n) => n.yob && n.fy != null && n.id !== nodeId,
        );
        let fyPerYear = 0;
        if (refNodes.length >= 2) {
          const a = refNodes[0];
          const b = refNodes.find((n) => Number(n.yob) !== Number(a.yob));
          if (b) {
            fyPerYear = (b.fy - a.fy) / (Number(b.yob) - Number(a.yob));
          }
        }
        if (fyPerYear !== 0) {
          node.fy = prevFy + yearDelta * fyPerYear;
        } else {
          // Fallback: shift proportionally from old position
          node.fy = prevFy;
        }
      } else if (node.yob) {
        // No previous fy — estimate from existing nodes
        node.fy = -node.yob;
      } else {
        node.fy = null;
      }
      if (node.fy !== null) node.y = node.fy;
    }
    d3Data.surnameList = rebuildSurnameList(d3Data.nodes);
    setHasEdits(true);
    setNodeVersion((v) => v + 1);
  };

  const addNode = (nodeData) => {
    const id = generateNodeId();
    const newNode = {
      id,
      name:
        `${nodeData.firstName || ""} ${nodeData.surname || ""}`.trim() ||
        "New Person",
      firstName: nodeData.firstName || "",
      surname: nodeData.surname || "",
      gender: nodeData.gender || "U",
      yob: nodeData.yob || "",
      yod: nodeData.yod || "",
      dob: nodeData.dob || "",
      dod: nodeData.dod || "",
      pob: nodeData.pob || "",
      pod: nodeData.pod || "",
      bio: nodeData.bio || "",
      title: nodeData.title || "",
      color: getNextColor(),
      fy: nodeData.yob ? -nodeData.yob : 0,
      families: [],
    };

    // Match color from existing nodes with same surname
    if (newNode.surname) {
      const match = d3Data.nodes.find((n) => n.surname === newNode.surname);
      if (match) newNode.color = match.color;
    }

    const newNodes = [...d3Data.nodes, newNode];
    const newSurnameList = rebuildSurnameList(newNodes);
    setD3Data({ ...d3Data, nodes: newNodes, surnameList: newSurnameList });
    setHasEdits(true);
    return id;
  };

  const removeNode = (nodeId) => {
    const newNodes = d3Data.nodes.filter((n) => n.id !== nodeId);
    const newLinks = d3Data.links.filter((link) => {
      const srcId =
        typeof link.source === "object" ? link.source.id : link.source;
      const tgtId =
        typeof link.target === "object" ? link.target.id : link.target;
      return srcId !== nodeId && tgtId !== nodeId;
    });
    // Reindex links
    newLinks.forEach((link, i) => {
      link.index = i;
    });
    const newSurnameList = rebuildSurnameList(newNodes);
    setD3Data({
      ...d3Data,
      nodes: newNodes,
      links: newLinks,
      surnameList: newSurnameList,
    });
    // Remove photo
    if (photoStore[nodeId]) {
      const newPhotos = { ...photoStore };
      delete newPhotos[nodeId];
      setPhotoStore(newPhotos);
    }
    setHasEdits(true);
    clearHighlights();
    setEditingNode(null);
  };

  const addLink = (sourceId, targetId, sourceType, targetType) => {
    // Check if link already exists
    const exists = d3Data.links.some((link) => {
      const srcId =
        typeof link.source === "object" ? link.source.id : link.source;
      const tgtId =
        typeof link.target === "object" ? link.target.id : link.target;
      return srcId === sourceId && tgtId === targetId;
    });
    if (exists) return;

    const newLink = {
      source: sourceId,
      target: targetId,
      sourceType,
      targetType,
      index: d3Data.links.length,
    };
    setD3Data({ ...d3Data, links: [...d3Data.links, newLink] });
    setHasEdits(true);
  };

  const removeLink = (linkIndex) => {
    const newLinks = d3Data.links.filter((link) => link.index !== linkIndex);
    newLinks.forEach((link, i) => {
      link.index = i;
    });
    setD3Data({ ...d3Data, links: newLinks });
    setHasEdits(true);
  };

  const setNodePhoto = (nodeId, dataUrl) => {
    setPhotoStore({ ...photoStore, [nodeId]: dataUrl });
    setHasEdits(true);
  };

  const removeNodePhoto = (nodeId) => {
    const newPhotos = { ...photoStore };
    delete newPhotos[nodeId];
    setPhotoStore(newPhotos);
    setHasEdits(true);
  };

  const startNewPlot = () => {
    colorIndex = 0;
    const id = generateNodeId();
    const firstColor = getNextColor();
    const starterNode = {
      id,
      name: "New Person",
      firstName: "New",
      surname: "Person",
      gender: "U",
      yob: "",
      yod: "",
      dob: "",
      dod: "",
      pob: "",
      pod: "",
      bio: "",
      title: "",
      color: firstColor,
      fy: 0,
      families: [],
    };
    const newD3Data = {
      nodes: [starterNode],
      links: [],
      surnameList: [{ surname: "Person", count: 1, color: firstColor }],
    };
    setD3Data(newD3Data);
    setShowingRoots(true);
    setShowError(false);
    setPhotoStore({});
    setHasEdits(false);
  };

  const samples = [
    { name: "shakespeare", load: () => readFile(shakespeareFile) },
    { name: "kennedy", load: () => readFile(kennedyFile) },
    { name: "kardashian", load: () => readFile(kardashianFile) },
    { name: "bach", load: () => readFile(bachFile) },
    { name: "tolkien", load: () => readFile(tolkienFile) },
    { name: "washington", load: () => readFile(washingtonFile) },
    { name: "british royals", load: () => readFile(royalFile) },
    { name: "greek myth", load: () => readFile(grekGodsFile) },
    { name: "roman myth", load: () => readFile(romanGodsFile) },
    { name: "shire folk", load: () => readFile(halflingFile) },
    { name: "potter", load: () => readFile(potterFile) },
  ];

  const handleExportGed = () => {
    downloadGedcom(d3Data, photoStore);
  };

  const handleExportGedz = () => {
    downloadGedz(d3Data, photoStore);
  };

  const openEditPanel = (node) => {
    setEditMode(true);
    setEditingNode(node);
  };

  const closeEditPanel = () => {
    setEditingNode(null);
  };

  return (
    <>
      {!showingRoots ? (
        <Load
          handleUpload={handleUpload}
          startNewPlot={startNewPlot}
          samples={samples}
          showError={showError}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <>
          <Controls
            d3Data={d3Data}
            closeRoots={closeRoots}
            highlights={highlights}
            highlightedFamily={highlightedFamily}
            setHighlightedFamily={setHighlightedFamily}
            showingSurnames={showingSurnames}
            setShowingSurnames={setShowingSurnames}
            isMobile={isMobile}
            theme={theme}
            toggleTheme={toggleTheme}
            nameFormat={nameFormat}
            setNameFormat={setNameFormat}
            editMode={editMode}
            setEditMode={setEditMode}
            openEditPanel={openEditPanel}
            photoStore={photoStore}
            handleExportGed={handleExportGed}
            handleExportGedz={handleExportGedz}
            addNode={addNode}
            setHighlights={setHighlights}
          />
          <Graph
            d3Data={d3Data}
            highlights={highlights}
            setHighlights={setHighlights}
            highlightedFamily={highlightedFamily}
            setHighlightedFamily={setHighlightedFamily}
            showingLegend={showingLegend}
            setShowingLegend={setShowingLegend}
            showingSurnames={showingSurnames}
            setShowingSurnames={setShowingSurnames}
            isMobile={isMobile}
            clearHighlights={clearHighlights}
            theme={theme}
            nameFormat={nameFormat}
            editMode={editMode}
          />
          {editingNode && editMode && (
            <EditPanel
              node={editingNode}
              d3Data={d3Data}
              updateNode={updateNode}
              removeNode={removeNode}
              addNode={addNode}
              addLink={addLink}
              removeLink={removeLink}
              photoStore={photoStore}
              setNodePhoto={setNodePhoto}
              removeNodePhoto={removeNodePhoto}
              onClose={closeEditPanel}
              isMobile={isMobile}
            />
          )}
          {showCloseWarning && (
            <div className="modal-overlay" onClick={() => setShowCloseWarning(false)}>
              <div className="modal-content close-warning" onClick={(e) => e.stopPropagation()}>
                <h2>unsaved changes</h2>
                <p>You have unsaved edits. Would you like to export before closing?</p>
                <div className="close-warning-actions">
                  <button onClick={() => { handleExportGedz(); forceClose(); }}>
                    export .gedz & close
                  </button>
                  <button onClick={() => { handleExportGed(); forceClose(); }}>
                    export .ged & close
                  </button>
                  <button onClick={forceClose}>
                    close without saving
                  </button>
                  <button onClick={() => setShowCloseWarning(false)}>
                    cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));

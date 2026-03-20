// Modules
import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { parse } from "./gedcom/parse";
import { d3ize } from "./gedcom/d3ize";

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


// Generate a unique ID for new nodes
let nodeCounter = 0;
function generateNodeId() {
  nodeCounter++;
  return `INEW${Date.now()}${nodeCounter}`;
}

// Color palette for new nodes
const colorList = [
  // Uniform pastels — distinct hues, similar saturation/lightness
  "#f6edd0",
  "#e8a09c",
  "#7cb8d0",
  "#c6c874",
  "#d4a070",
  "#8fc4af",
  "#c4a0d8",
  "#e8c06a",
  "#68b8b0",
  "#cc9cb4",
  "#9ca0d4",
  "#a4c490",
  "#d88e88",
  // Varied — broader range of saturation, lightness, and warmth
  "#b8dce8",
  "#c07068",
  "#8ca860",
  "#d4b8cc",
  "#e8d8a0",
  "#7090b8",
  "#8888d0",
  "#509888",
  "#e8b0c0",
  "#b8b498",
  "#b08060",
  "#b8d8a0",
  "#a080a8",
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

// Estimate fy position for a birth year based on existing dated nodes.
// Uses the same scale that d3ize applies so new/edited nodes land on the
// existing timeline rather than jumping to a raw -yob value.
function estimateFy(yob, nodes, excludeId) {
  const refNodes = nodes.filter(
    (n) => n.yob && n.fy != null && n.id !== excludeId,
  );
  if (refNodes.length >= 2) {
    const a = refNodes[0];
    const b = refNodes.find((n) => Number(n.yob) !== Number(a.yob));
    if (b) {
      const fyPerYear = (b.fy - a.fy) / (Number(b.yob) - Number(a.yob));
      return a.fy + (Number(yob) - Number(a.yob)) * fyPerYear;
    }
  } else if (refNodes.length === 1) {
    const ref = refNodes[0];
    const ratio =
      nodes.length <= 50 ? 3 : nodes.length <= 150 ? 4 : nodes.length <= 250 ? 5 : 6;
    return ref.fy + (Number(ref.yob) - Number(yob)) * ratio;
  }
  // No reference nodes — keep node near origin
  return 0;
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
  const [graphReady, setGraphReady] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [loadVisible, setLoadVisible] = useState(true);
  const graphRef = useRef(null);

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

  // Set data-theme attribute on body, persist to localStorage, and update theme-color
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Update the meta theme-color to match the current theme
    const themeColor = theme === "light" ? "#fcfaf4" : "#010000";
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
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

  // Build full family-tree highlights for a node (ancestors, descendants, spouses)
  const buildNodeHighlights = (node) => {
    clearHighlights();
    const links = d3Data.links;

    let tempHighlights = {
      node: node,
      family: [node.id],
      links: [],
      spouses: [],
      notDescendent: [],
    };
    const cloneable = { ...tempHighlights };
    delete cloneable.node;

    // Nuclear family
    links.forEach((link) => {
      const srcId = typeof link.source === "object" ? link.source.id : link.source;
      const tgtId = typeof link.target === "object" ? link.target.id : link.target;
      if (srcId === node.id) {
        tempHighlights.family.push(tgtId);
        tempHighlights.links.push(link.index);
        if (
          (link.sourceType === "WIFE" || link.sourceType === "HUSB") &&
          (link.targetType === "WIFE" || link.targetType === "HUSB")
        ) {
          tempHighlights.spouses.push(tgtId);
        }
        if (link.targetType !== "CHIL") {
          tempHighlights.notDescendent.push(tgtId);
        }
      } else if (tgtId === node.id) {
        tempHighlights.family.push(srcId);
        tempHighlights.links.push(link.index);
        if (
          (link.sourceType === "WIFE" || link.sourceType === "HUSB") &&
          (link.targetType === "WIFE" || link.targetType === "HUSB")
        ) {
          tempHighlights.spouses.push(srcId);
        }
        tempHighlights.notDescendent.push(srcId);
      }
    });

    // Parental lines
    const buildParentLines = (h) => {
      links.forEach((link) => {
        const srcId = typeof link.source === "object" ? link.source.id : link.source;
        const tgtId = typeof link.target === "object" ? link.target.id : link.target;
        if (
          h.family.indexOf(tgtId) !== -1 &&
          h.family.indexOf(srcId) === -1 &&
          h.spouses.indexOf(tgtId) === -1 &&
          link.sourceType !== "CHIL" &&
          link.targetType !== "WIFE"
        ) {
          h.family.push(srcId);
          h.links.push(link.index);
        }
      });
    };

    let parentH = {
      family: [node.id],
      links: [],
      spouses: [...tempHighlights.spouses],
      notDescendent: [],
    };
    while (true) {
      const before = parentH.family.length;
      buildParentLines(parentH);
      if (parentH.family.length === before) break;
    }

    // Descendant lines
    const buildDescendantLines = (h) => {
      links.forEach((link) => {
        const srcId = typeof link.source === "object" ? link.source.id : link.source;
        const tgtId = typeof link.target === "object" ? link.target.id : link.target;
        if (
          h.family.indexOf(srcId) !== -1 &&
          h.family.indexOf(tgtId) === -1 &&
          h.notDescendent.indexOf(srcId) === -1 &&
          link.targetType === "CHIL"
        ) {
          h.family.push(tgtId);
          h.links.push(link.index);
        }
      });
    };

    tempHighlights.family = [...new Set(tempHighlights.family)];
    tempHighlights.links = [...new Set(tempHighlights.links)];

    let descendantH = structuredClone(cloneable);
    while (true) {
      const before = descendantH.family.length;
      buildDescendantLines(descendantH);
      if (descendantH.family.length === before) break;
    }

    tempHighlights.family.push(...parentH.family, ...descendantH.family);
    tempHighlights.links.push(...parentH.links, ...descendantH.links);
    tempHighlights.family = [...new Set(tempHighlights.family)];
    tempHighlights.links = [...new Set(tempHighlights.links)];

    setHighlights(tempHighlights);
  };

  const onGraphReady = useCallback(() => {
    setGraphReady(true);
    setTimeout(() => setControlsVisible(true), 1000);
  }, []);

  const readFile = (file) => {
    setLoadVisible(false);
    setGraphReady(false);
    setControlsVisible(false);
    setTimeout(() => {
      setD3Data(d3ize(parse(file)));
      setShowingRoots(true);
      setShowError(false);
      setPhotoStore({});
      setEditMode(false);
      setEditingNode(null);
      setHasEdits(false);
    }, 1200);
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
    setLoadVisible(true);
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
    const prevSurname = node.surname;
    // Mutate in place to preserve force-graph internal properties (x, y, z, fy, etc.)
    Object.assign(node, updates);
    if (updates.firstName !== undefined || updates.surname !== undefined) {
      node.name = `${node.firstName || ""} ${node.surname || ""}`.trim();
    }
    if (updates.surname !== undefined && updates.surname !== prevSurname) {
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
        // No previous yob — estimate from existing dated nodes
        node.fy = estimateFy(node.yob, d3Data.nodes, nodeId);
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
      fy: nodeData.yob ? estimateFy(nodeData.yob, d3Data.nodes) : 0,
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
    return newNode;
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
    setD3Data((prev) => {
      // Check if link already exists
      const exists = prev.links.some((link) => {
        const srcId =
          typeof link.source === "object" ? link.source.id : link.source;
        const tgtId =
          typeof link.target === "object" ? link.target.id : link.target;
        return srcId === sourceId && tgtId === targetId;
      });
      if (exists) return prev;

      const newLink = {
        source: sourceId,
        target: targetId,
        sourceType,
        targetType,
        index: prev.links.length,
      };
      return { ...prev, links: [...prev.links, newLink] };
    });
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

  const updateFamilyColor = (surname, newColor) => {
    d3Data.nodes.forEach((node) => {
      if (node.surname === surname) {
        node.color = newColor;
      }
    });
    const entry = d3Data.surnameList.find((s) => s.surname === surname);
    if (entry) entry.color = newColor;
    setHasEdits(true);
    setNodeVersion((v) => v + 1);
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
    setLoadVisible(false);
    setGraphReady(false);
    setControlsVisible(false);
    setTimeout(() => {
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
    }, 1200);
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
        <div style={{ opacity: loadVisible ? 1 : 0, transition: 'opacity 1.2s ease-in-out' }}>
        <Load
          handleUpload={handleUpload}
          startNewPlot={startNewPlot}
          samples={samples}
          showError={showError}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        </div>
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
            controlsVisible={controlsVisible}
            graphRef={graphRef}
            buildNodeHighlights={buildNodeHighlights}
            updateFamilyColor={updateFamilyColor}
            colorList={colorList}
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
            editPanelOpen={editMode && !!editingNode}
            onReady={onGraphReady}
            graphRef={graphRef}
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
              openEditPanel={openEditPanel}
              isMobile={isMobile}
              updateFamilyColor={updateFamilyColor}
              colorList={colorList}
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

// Register service worker for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}

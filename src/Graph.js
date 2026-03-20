// Modules
import React, { useEffect, useRef, useState, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { forceCollide } from "d3-force-3d";
import Hammer from "hammerjs";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

const Graph = ({
  d3Data,
  highlights,
  setHighlights,
  highlightedFamily,
  showingLegend,
  setShowingLegend,
  showingSurnames,
  setShowingSurnames,
  isMobile,
  clearHighlights,
  theme,
  nameFormat,
  onReady,
  editPanelOpen,
  graphRef,
}) => {
  // console.log(`d3Data`, d3Data)

  // STATE //
  const [fontReady, setFontReady] = useState(false);
  const fgRef = useRef();

  // Expose fgRef to parent for camera control (e.g. search zoom)
  useEffect(() => {
    if (graphRef) graphRef.current = fgRef.current;
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const justPinchedRef = useRef(false);

  // Preload Josefin Sans so node labels and timeline never use a fallback font
  useEffect(() => {
    document.fonts.load('bold italic 16px "Josefin Sans"').then(() => {
      setFontReady(true);
    });
  }, []);

  // THEME COLORS
  const themeColors =
    theme === "light"
      ? {
          label: "#181818",
          labelBg: "#fff",
          labelBorder: "#666",
          muted: "#4443",
          mutedBg: "#fff2",
          mutedBorder: "#ccc3",
          timeline: 0xe0e0e0,
          timelineText: "#181818",
          romantic: "rgba(230, 180, 30, 0.9)",
          normal: "rgba(220, 80, 80, 0.3)",
          mutedLink: "rgba(200,200,200,0.15)",
          highlighted: "rgba(220, 80, 80, 0.45)",
          background: "#fcfaf4",
          padding: 4,
        }
      : {
          label: "#fcfaf4",
          labelBg: "#1a1a1acc",
          labelBorder: "#444",
          muted: "#6665",
          mutedBg: "#2222",
          mutedBorder: "#5555",
          timeline: 0x555555,
          timelineText: "#f6edd0",
          romantic: "rgba(220, 185, 60, 0.6)",
          normal: "rgba(252, 103, 103, 0.45)",
          mutedLink: "rgba(167, 98, 98, 0.15)",
          highlighted: "rgba(252, 103, 103, 0.7)",
          background: "#1a1a1a",
          padding: 3,
        };

  // DESIGN //

  const setNodeThreeObject = useCallback(
    (node) => {
      // Use a sphere as a drag handle
      const obj = new THREE.Mesh(
        new THREE.SphereGeometry(25),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      );

      // Add text sprite as child
      let name;
      if (node.firstName == "?") {
        name = node.name;
      } else if (node.firstName === node.surname) {
        name = node.firstName;
      } else {
        name =
          nameFormat === "lastFirst"
            ? `${node.surname}, ${node.firstName}`
            : `${node.firstName} ${node.surname}`;
      }
      let sprite = new SpriteText(name);

      // Sprite defaults
      const coloredSprite = () => {
        sprite.color = "#000";
        sprite.backgroundColor = node.color;
        sprite.borderColor = themeColors.labelBorder;
      };

      const greyedSprite = () => {
        sprite.color = themeColors.muted;
        sprite.backgroundColor = "#0000";
        sprite.borderColor = themeColors.mutedBorder;
      };

      // NODE.COLOR
      // No highlighted node
      if (highlights.node === null) {
        if (highlightedFamily) {
          if (highlightedFamily === node.surname) {
            coloredSprite();
          } else {
            greyedSprite();
          }
        } else {
          coloredSprite();
        }
      } else {
        if (highlights.family.indexOf(node.id) !== -1) {
          coloredSprite();
        } else {
          greyedSprite();
        }
      }

      sprite.fontFace = "Josefin Sans";
      sprite.fontWeight = 700;
      sprite.fontStyle = "italic";
      sprite.textHeight = 10;
      sprite.borderWidth = 0.4;
      sprite.borderRadius = 8;
      sprite.padding = themeColors.padding;
      obj.add(sprite);
      return obj;
    },
    [highlights, highlightedFamily, themeColors, nameFormat],
  );

  // Link color
  const getLinkColor = useCallback(
    (link) => {
      return highlights.links.length < 1
        ? highlightedFamily
          ? themeColors.mutedLink // Highlighed family exists, mute all links
          : link.sourceType != "CHIL" && link.targetType != "CHIL"
            ? themeColors.romantic // Romantic link
            : themeColors.normal // Normal link
        : highlights.links.indexOf(link.index) !== -1
          ? link.sourceType != "CHIL" && link.targetType != "CHIL"
            ? themeColors.romantic // Romantic link
            : themeColors.highlighted // Highlighted link
          : themeColors.mutedLink; // Muted link
    },
    [highlights, highlightedFamily, themeColors],
  );

  // Link width
  const getLinkWidth = useCallback(
    (link) => {
      const isRomantic = link.sourceType != "CHIL" && link.targetType != "CHIL";
      if (highlights.links.indexOf(link.index) !== -1) {
        return isRomantic ? 2.5 : 1.5;
      } else {
        return isRomantic ? 2 : 1.5;
      }
    },
    [highlights],
  );

  // Custom link object for dashed romance lines
  const getLinkThreeObject = useCallback(
    (link) => {
      const isRomantic = link.sourceType != "CHIL" && link.targetType != "CHIL";
      if (!isRomantic) return undefined;

      const material = new LineMaterial({
        color: 0xffb400,
        linewidth: theme === "light" ? 2.5 : 1.5,
        dashSize: 8,
        gapSize: 4,
        resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      });
      material.dashed = true;
      material.defines.USE_DASH = "";
      material.needsUpdate = true;
      const geometry = new LineGeometry();
      geometry.setPositions([0, 0, 0, 0, 0, 0]);
      const line = new Line2(geometry, material);
      line.computeLineDistances();
      return line;
    },
    [theme],
  );

  // Update dashed line positions and colors
  const getLinkPositionUpdate = useCallback(
    (obj, { start, end }, link) => {
      const isRomantic = link.sourceType != "CHIL" && link.targetType != "CHIL";
      if (!isRomantic) return;

      obj.geometry.setPositions([
        start.x,
        start.y,
        start.z,
        end.x,
        end.y,
        end.z,
      ]);
      obj.computeLineDistances();

      // Update color from rgba string
      const color = getLinkColor(link);
      if (typeof color === "string" && color.startsWith("rgba")) {
        const parts = color.match(/[\d.]+/g);
        obj.material.color.setRGB(
          parseFloat(parts[0]) / 255,
          parseFloat(parts[1]) / 255,
          parseFloat(parts[2]) / 255,
        );
        obj.material.opacity = parseFloat(parts[3]);
        obj.material.transparent = true;
      } else {
        obj.material.color.set(color);
      }

      return true; // signal that we've handled positioning
    },
    [getLinkColor],
  );

  // Link particles
  const getLinkParticleWidth = useCallback(
    (link) => {
      if (highlights.links.indexOf(link.index) !== -1) {
        return 4;
      } else {
        return 0.1;
      }
    },
    [highlights],
  );

  // USE EFFECT
  useEffect(() => {
    if (!fontReady || !fgRef.current) return;

    // Manage force
    fgRef.current.d3Force("collide", forceCollide(55));

    // controls
    fgRef.current.controls().enableDamping = true;
    fgRef.current.controls().dampingFactor = 0.3;
    fgRef.current.controls().rotateSpeed = 0.8;
    fgRef.current.controls().screenSpacePanning = true;

    // Track timeline objects for cleanup
    const timelineObjects = [];

    const buildTimeline = () => {
      // Get list of fixed Y (filter before converting so fy:0 is kept but fy:null is not)
      let yRange = d3Data.nodes
        .filter((node) => node.fy != null)
        .map((node) => Number(node.fy));
      yRange = yRange.filter((val) => !isNaN(val));

      if (yRange.length < 2) return;

      const highestY = Math.max.apply(Math, yRange);
      const lowestY = Math.min.apply(Math, yRange);
      if (!isFinite(highestY) || !isFinite(lowestY) || highestY === lowestY) return;

      // Timeline line
      var material = new THREE.LineBasicMaterial({
        color: themeColors.timeline,
        linewidth: 2,
      });

      var points = [];
      points.push(new THREE.Vector3(0, lowestY, 0));
      points.push(new THREE.Vector3(0, highestY, 0));

      var geometry = new THREE.BufferGeometry().setFromPoints(points);
      var line = new THREE.Line(geometry, material);
      fgRef.current.scene().add(line);
      timelineObjects.push(line);

      // Timeline years
      let years = d3Data.nodes
        .filter((node) => node.yob != null && node.yob !== "" && node.yob !== "?")
        .map((node) => Number(node.yob));
      years = years.filter((year) => !isNaN(year));

      const halfY = (highestY + lowestY) / 2;
      const quarterY = (halfY + lowestY) / 2;
      const threeQuarterY = (halfY + highestY) / 2;

      const earliestYOB = years.length > 0 ? Math.min.apply(Math, years) : null;
      const latestYOB = years.length > 0 ? Math.max.apply(Math, years) : null;
      const halfYOB = parseInt((earliestYOB + latestYOB) / 2);
      const quarterYOB = parseInt((latestYOB + halfYOB) / 2);
      const threeQuarterYOB = parseInt((earliestYOB + halfYOB) / 2);

      const makeTimeLabel = (text, textHeight) => {
        let label = new SpriteText(text);
        label.color = themeColors.timelineText;
        label.fontFace = "Josefin Sans";
        label.fontWeight = "700";
        label.fontStyle = "italic";
        label.textHeight = textHeight;
        return label;
      };

      const makeLabelMesh = (yPos, text, textHeight) => {
        let mesh = new THREE.Mesh(
          new THREE.SphereGeometry(100),
          new THREE.MeshBasicMaterial({
            depthWrite: false,
            transparent: true,
            opacity: 0,
          }),
        );
        mesh.position.y = yPos;
        mesh.add(makeTimeLabel(text, textHeight));
        return mesh;
      };

      const earliest = makeLabelMesh(
        highestY + 15,
        earliestYOB || "Earlier",
        25,
      );
      fgRef.current.scene().add(earliest);
      timelineObjects.push(earliest);

      const latest = makeLabelMesh(lowestY - 15, latestYOB || "Later", 25);
      fgRef.current.scene().add(latest);
      timelineObjects.push(latest);

      if (years.length > 0 && highestY - lowestY > 300) {
        const half = makeLabelMesh(halfY, halfYOB, 15);
        fgRef.current.scene().add(half);
        timelineObjects.push(half);
      }
      if (years.length > 0 && highestY - lowestY > 450) {
        const quarter = makeLabelMesh(quarterY, quarterYOB, 15);
        fgRef.current.scene().add(quarter);
        timelineObjects.push(quarter);

        const threeQuarter = makeLabelMesh(threeQuarterY, threeQuarterYOB, 15);
        fgRef.current.scene().add(threeQuarter);
        timelineObjects.push(threeQuarter);
      }
    };

    buildTimeline();

    // Cleanup: remove timeline objects when effect re-runs
    return () => {
      timelineObjects.forEach((obj) => {
        fgRef.current.scene().remove(obj);
      });
    };
  }, [d3Data, themeColors, fontReady]);

  const [graphReady, setGraphReady] = useState(false);
  const hasZoomedRef = useRef(false);

  // Reset when data changes
  useEffect(() => {
    setGraphReady(false);
    hasZoomedRef.current = false;
  }, [d3Data]);

  const handleEngineStop = useCallback(() => {
    if (hasZoomedRef.current) return;
    hasZoomedRef.current = true;
    setTimeout(() => {
      if (fgRef.current) {
        // Center orbit target on graph midpoint
        const nodes = d3Data.nodes;
        if (nodes.length > 0) {
          let minY = Infinity, maxY = -Infinity;
          nodes.forEach((n) => {
            const y = n.y ?? n.fy ?? 0;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          });
          const midY = (minY + maxY) / 2;
          const controls = fgRef.current.controls();
          controls.target.set(0, midY, 0);
          controls.update();
        }

        const padding = isMobile
          ? (nodes.length > 30 ? -50 : 20)
          : (nodes.length > 100 ? 10 : nodes.length > 30 ? 30 : 60);
        fgRef.current.zoomToFit(0, padding);

        // Prevent over-zoom on small graphs
        const camera = fgRef.current.camera();
        const target = fgRef.current.controls().target;
        const dist = camera.position.distanceTo(target);
        const minDistance = 500;
        if (dist < minDistance) {
          const dir = camera.position.clone().sub(target).normalize();
          camera.position.copy(target).add(dir.multiplyScalar(minDistance));
        }
      }
      setGraphReady(true);
      if (onReady) onReady();
    }, 1000);
  }, [onReady]);

  // LOGIC //

  // Handle node click
  const handleNodeClick = (node) => {
    if (editPanelOpen) return;
    clearHighlights();

    // Only action if new node is clicked
    if (highlights.node !== node) {
      let tempHighlights = {
        node: node,
        family: [node.id],
        links: [],
        spouses: [],
        notDescendent: [],
      };
      const cloneable = { ...tempHighlights };
      delete cloneable.node;

      // Build nuclear family
      d3Data.links.forEach((link) => {
        if (link.source.id === node.id) {
          tempHighlights.family.push(link.target.id);
          tempHighlights.links.push(link.index);
          if (
            (link.sourceType === "WIFE" || link.sourceType === "HUSB") &&
            (link.targetType === "WIFE" || link.targetType === "HUSB")
          ) {
            tempHighlights.spouses.push(link.target.id);
          }
          if (link.targetType !== "CHIL") {
            tempHighlights.notDescendent.push(link.target.id);
          }
        } else if (link.target.id === node.id) {
          tempHighlights.family.push(link.source.id);
          tempHighlights.links.push(link.index);
          if (
            (link.sourceType === "WIFE" || link.sourceType === "HUSB") &&
            (link.targetType === "WIFE" || link.targetType === "HUSB")
          ) {
            tempHighlights.spouses.push(link.source.id);
          }
          tempHighlights.notDescendent.push(link.source.id);
        }
      });

      // Build parental lines
      const buildParentLines = (parentTempHighlights) => {
        d3Data.links.forEach((link) => {
          if (
            parentTempHighlights.family.indexOf(link.target.id) !== -1 &&
            parentTempHighlights.family.indexOf(link.source.id) === -1 &&
            parentTempHighlights.spouses.indexOf(link.target.id) === -1 &&
            link.sourceType != "CHIL" &&
            link.targetType != "WIFE"
          ) {
            parentTempHighlights.family.push(link.source.id);
            parentTempHighlights.links.push(link.index);
          }
        });
      };

      let parentTempHighlights = {
        family: [node.id],
        links: [],
        spouses: [...tempHighlights.spouses],
        notDescendent: [],
      };
      while (true) {
        const lengthBefore = parentTempHighlights.family.length;
        buildParentLines(parentTempHighlights);
        const lengthAfter = parentTempHighlights.family.length;
        if (lengthAfter === lengthBefore) {
          break; // Exit loop if array length didn't change
        }
      }

      // Build descendent lines
      const buildDescendentLines = (descendentTempHighlights) => {
        d3Data.links.forEach((link) => {
          if (
            descendentTempHighlights.family.indexOf(link.source.id) !== -1 &&
            descendentTempHighlights.family.indexOf(link.target.id) === -1 &&
            descendentTempHighlights.notDescendent.indexOf(link.source.id) ===
              -1 &&
            link.targetType === "CHIL"
          ) {
            descendentTempHighlights.family.push(link.target.id);
            descendentTempHighlights.links.push(link.index);
          }
        });
      };
      // Remove duplicates
      tempHighlights.family = [...new Set(tempHighlights.family)];
      tempHighlights.links = [...new Set(tempHighlights.links)];

      let descendentTempHighlights = structuredClone(cloneable);
      while (true) {
        const lengthBefore = descendentTempHighlights.family.length;
        buildDescendentLines(descendentTempHighlights);
        const lengthAfter = descendentTempHighlights.family.length;
        console.log("lengthBefore", lengthBefore);
        console.log("lengthAfter", lengthAfter);
        if (lengthAfter === lengthBefore) {
          console.log("descendentLines length didn't change, exiting loop");
          break; // Exit loop if array length didn't change
        }
      }

      tempHighlights.family.push(...parentTempHighlights.family);
      tempHighlights.links.push(...parentTempHighlights.links);
      tempHighlights.family.push(...descendentTempHighlights.family);
      tempHighlights.links.push(...descendentTempHighlights.links);

      // Remove duplicates
      tempHighlights.family = [...new Set(tempHighlights.family)];
      tempHighlights.links = [...new Set(tempHighlights.links)];

      // Set highlights
      console.log("highlights", tempHighlights);
      setHighlights(tempHighlights);
    }
  };

  // Handle touch events for mobile
  useEffect(() => {
    if (!isMobile) return;

    const canvas = fgRef.current?.renderer().domElement;
    if (!canvas) return;

    const hammer = new Hammer.Manager(canvas);
    const singleTap = new Hammer.Tap({ event: "singletap" });
    const pinch = new Hammer.Pinch();

    pinch.recognizeWith(singleTap);
    hammer.add([singleTap, pinch]);

    hammer.on("singletap", (ev) => {
      const bounds = canvas.getBoundingClientRect();
      mouse.x = ((ev.center.x - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((ev.center.y - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, fgRef.current.camera());
      const intersects = raycaster.intersectObjects(
        fgRef.current.scene().children,
        true,
      );
      const getNodeData = (obj) => {
        let cur = obj;
        while (cur) {
          if (cur.__data && cur.__data.id) return cur.__data;
          cur = cur.parent;
        }
        return null;
      };

      const nodeObject = intersects.find((intersect) =>
        getNodeData(intersect.object),
      );

      if (nodeObject) {
        const node = getNodeData(nodeObject.object);
        console.log(node);
        if (navigator.vibrate) navigator.vibrate(25);
        handleNodeClick(node);
      } else if (showingSurnames || showingLegend) {
        setShowingSurnames(false);
        setShowingLegend(false);
      } else if (!editPanelOpen) {
        clearHighlights();
      }
    });

    hammer.on("pinchstart", () => {
      justPinchedRef.current = true;
    });

    hammer.on("pinchend", () => {
      setTimeout(() => {
        justPinchedRef.current = false;
      }, 500);
    });

    return () => {
      hammer.destroy();
    };
  }, [fontReady, highlights, showingSurnames, showingLegend]);

  // BUILD GRAPH //
  if (!fontReady) return null;

  return (
    <div style={{ opacity: graphReady ? 1 : 0, transition: 'opacity 3.6s ease-in-out' }}>
    <ForceGraph3D
      ref={fgRef}
      graphData={d3Data}
      warmupTicks={300}
      cooldownTicks={0}
      onEngineStop={handleEngineStop}
      // Display
      width={window.innerWidth}
      height={window.innerHeight}
      backgroundColor={themeColors.background}
      showNavInfo={false}
      // Controls
      controlType={"orbit"}
      enableNodeDrag={false}
      onBackgroundClick={isMobile || editPanelOpen ? undefined : clearHighlights}
      // Nodes
      nodeThreeObject={setNodeThreeObject}
      nodeLabel={null}
      onNodeClick={!isMobile ? (node) => handleNodeClick(node) : undefined}
      onNodeDragEnd={() => {
        if (touchTimeout) {
          clearTimeout(touchTimeout);
          touchTimeout = null;
        }
      }}
      // LINKS
      linkLabel={null}
      linkColor={getLinkColor}
      linkOpacity={1}
      linkWidth={getLinkWidth}
      linkThreeObject={getLinkThreeObject}
      linkPositionUpdate={getLinkPositionUpdate}
      linkDirectionalParticles={(link) =>
        link.sourceType != "CHIL" &&
        link.targetType == "CHIL" &&
        d3Data.nodes.length < 300
          ? highlights.links.length > 0
            ? 4
            : 4
          : 0
      }
      linkDirectionalParticleWidth={getLinkParticleWidth}
      linkDirectionalParticleSpeed={0.001}
      linkDirectionalArrowLength={(link) =>
        d3Data.nodes.length >= 300 &&
        (link.sourceType === "CHIL" || link.targetType === "CHIL") &&
        highlights.links.indexOf(link.index) !== -1
          ? 10
          : 0
      }
      linkDirectionalArrowRelPos={0.75}
      linkDirectionalArrowColor={getLinkColor}
    />
    </div>
  );
};

export default Graph;

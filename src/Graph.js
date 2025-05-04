// Modules
import React, { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";
import SpriteText from "three-spritetext";
import { forceCollide } from "d3-force-3d";

const Graph = ({ d3Data, highlights, setHighlights, highlightedFamily, setHighlightedFamily, selectedNode, setSelectedNode, showingLegend, setShowingLegend, showingSurnames, setShowingSurnames, isMobile }) => {

  // STATE //
  const fgRef = useRef();
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const lastTapRef = useRef(0);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // DESIGN //

  const setNodeThreeObject = useCallback((node) => {
    // Use a sphere as a drag handle
    const obj = new THREE.Mesh(
      new THREE.SphereGeometry(18),
      // new THREE.MeshBasicMaterial({ color: node.color || 'skyblue' }),
      new THREE.MeshBasicMaterial({
        depthWrite: false,
        transparent: true,
        opacity: 0,
      })
    );

    // Add text sprite as child
    let name;
    if (node.firstName == "?") {
      name = node.name;
    } else {
      name = `${node.firstName} ${node.surname}`;
    }
    let sprite = new SpriteText(name);

    // Sprite defaults
    const coloredSprite = () => {
      sprite.color = node.color;
      sprite.backgroundColor = "#000c";
      sprite.borderColor = "#555";
    };

    const greyedSprite = () => {
      sprite.color = "#3335";
      sprite.backgroundColor = "#0002";
      sprite.borderColor = "#3333";
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

    sprite.fontFace = "Helvetica";
    sprite.fontWeight = 600;
    sprite.textHeight = 10;
    sprite.borderWidth = .4;
    sprite.borderRadius = 8;
    sprite.padding = 4;
    obj.add(sprite);
    return obj;
  }, [highlights, highlightedFamily]);

  // Link color
  const setLinkColor = (link) => {
    return highlights.links.length < 1
      ? highlightedFamily
        ? "rgba(252, 103, 103, 0.15)" // Highlighed family exists, mute all links
        : link.sourceType != "CHIL" && link.targetType != "CHIL"
        ? "rgba(255, 215, 0, 0.6)" // Romantic link
        : "rgba(252, 103, 103, 0.3)" // Normal link
      : highlights.links.indexOf(link.index) !== -1
      ? link.sourceType != "CHIL" && link.targetType != "CHIL"
        ? "rgba(255, 215, 0, 0.6)" // Romantic link
        : "rgba(252, 103, 103, 0.3)" // Normal link
      : "rgba(252, 103, 103, 0.14)"; // Normal link
  };

  // Link width
  const setLinkWidth = (link) => {
    if (highlights.links.indexOf(link.index) !== -1) {
      return 1.5;
    } else {
      return 1.5;
    }
  };

  // Link particles
  const setLinkParticleWidth = (link) => {
    if (highlights.links.indexOf(link.index) !== -1) {
      return 2;
    } else {
      return 0.1;
    }
  };

  // USE EFFECT
  useEffect(() => {
    // Manage force
    fgRef.current.d3Force("collide", forceCollide(55));

    // Add timeline //
    (function () {
      // Get list of fixed Y
      let yRange = d3Data.nodes.map((node) => Number(node.fy));

      // Filter out NaN
      yRange = yRange.filter((node) => !isNaN(node) && node);

      // TIMELINE
      const highestY = Math.max.apply(Math, yRange);
      const lowestY = Math.min.apply(Math, yRange);

      // Create a blue LineBasicMaterial
      var material = new THREE.LineBasicMaterial({
        color: 0x333333,
        linewidth: 2,
      });

      var points = [];
      points.push(new THREE.Vector3(0, lowestY, 0));
      points.push(new THREE.Vector3(0, highestY, 0));

      var geometry = new THREE.BufferGeometry().setFromPoints(points);

      var line = new THREE.Line(geometry, material);

      fgRef.current.scene().add(line);
    })();

    // Add timeline years
    (function () {
      // All YOBs
      let years = d3Data.nodes.map((node) => Number(node.yob));

      // Filter out NaN
      years = years.filter((year) => !isNaN(year));

      // Get list of fixed Y
      let yRange = d3Data.nodes.map((node) => Number(node.fy));

      // Filter out NaN
      yRange = yRange.filter((node) => !isNaN(node) && node);

      // TIMELINE
      const highestY = Math.max.apply(Math, yRange);
      const lowestY = Math.min.apply(Math, yRange);
      const halfY = (highestY + lowestY) / 2;
      const quarterY = (halfY + lowestY) / 2;
      const threeQuarterY = (halfY + highestY) / 2;

      const earliestYOB = Math.min.apply(Math, years);
      const latestYOB = Math.max.apply(Math, years);
      const halfYOB = parseInt((earliestYOB + latestYOB) / 2);
      const quarterYOB = parseInt((latestYOB + halfYOB) / 2);
      const threeQuarterYOB = parseInt((earliestYOB + halfYOB) / 2);

      // EARLIEST
      let earliest = new THREE.Mesh(
        new THREE.SphereGeometry(100),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          transparent: true,
          opacity: 0,
        })
      );

      earliest.position.y = highestY + 15;

      let earliestTimeLabel = earliestYOB
        ? new SpriteText(earliestYOB)
        : new SpriteText("Earlier");
      earliestTimeLabel.color = "#f8f8f8";
      earliestTimeLabel.fontFace = "Helvetica";
      earliestTimeLabel.fontWeight = 800;
      earliestTimeLabel.textHeight = 25;
      earliest.add(earliestTimeLabel);

      // LATEST
      let latest = new THREE.Mesh(
        new THREE.SphereGeometry(100),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          transparent: true,
          opacity: 0,
        })
      );

      latest.position.y = lowestY - 15;

      let latestTimeLabel = latestYOB
        ? new SpriteText(latestYOB)
        : new SpriteText("Later");
      latestTimeLabel.color = "#f8f8f8";
      latestTimeLabel.fontFace = "Helvetica";
      latestTimeLabel.fontWeight = 800;
      latestTimeLabel.textHeight = 25;
      latest.add(latestTimeLabel);

      // HALF
      let half = new THREE.Mesh(
        new THREE.SphereGeometry(100),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          transparent: true,
          opacity: 0,
        })
      );

      half.position.y = halfY;

      let halfTimeLabel = new SpriteText(halfYOB);
      halfTimeLabel.color = "#ccc";
      halfTimeLabel.fontFace = "Helvetica";
      halfTimeLabel.fontWeight = 800;
      halfTimeLabel.textHeight = 15;
      half.add(halfTimeLabel);

      // QUARTER
      let quarter = new THREE.Mesh(
        new THREE.SphereGeometry(100),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          transparent: true,
          opacity: 0,
        })
      );

      quarter.position.y = quarterY;

      let quarterTimeLabel = new SpriteText(quarterYOB);
      quarterTimeLabel.color = "#ccc";
      quarterTimeLabel.fontFace = "Helvetica";
      quarterTimeLabel.fontWeight = 800;
      quarterTimeLabel.textHeight = 15;
      quarter.add(quarterTimeLabel);

      // QUARTER
      let threeQuarter = new THREE.Mesh(
        new THREE.SphereGeometry(100),
        new THREE.MeshBasicMaterial({
          depthWrite: false,
          transparent: true,
          opacity: 0,
        })
      );

      threeQuarter.position.y = threeQuarterY;

      let threeQuarterTimeLabel = new SpriteText(threeQuarterYOB);
      threeQuarterTimeLabel.color = "#ccc";
      threeQuarterTimeLabel.fontFace = "Helvetica";
      threeQuarterTimeLabel.fontWeight = 800;
      threeQuarterTimeLabel.textHeight = 15;
      threeQuarter.add(threeQuarterTimeLabel);

      fgRef.current.scene().add(earliest);
      fgRef.current.scene().add(latest);
      highestY - lowestY > 300 && fgRef.current.scene().add(half);
      highestY - lowestY > 450 && fgRef.current.scene().add(quarter);
      highestY - lowestY > 450 && fgRef.current.scene().add(threeQuarter);
    })();

    // controls
    fgRef.current.controls().enableDamping = true;
    fgRef.current.controls().dampingFactor = 0.3;
    fgRef.current.controls().rotateSpeed = 0.8;
    fgRef.current.controls().screenSpacePanning = true;
  }, []);


  // LOGIC //

  // Clear highlights
  const clearHighlights = () => {
    setHighlights({ node: null, family: [], links: [] });
    setHighlightedFamily(null);
    setSelectedNode(null);
    setShowingLegend(false);
    setShowingSurnames(false);
  };

  // Handle node click
  const handleNodeClick = (node) => {
    clearHighlights();

    // Find family member of clicked node
    const findFamilies = (links, node, highlights) => {
      if (links.source.id == node.id || links.target.id == node.id) {
        let updatedHighlightFamily = highlights.family;
        let updatedHighlightLinks = highlights.links;

        updatedHighlightFamily.push(links.target.id, links.source.id);
        updatedHighlightLinks.push(links.index);

        setHighlights({
          node: node,
          family: updatedHighlightFamily,
          links: updatedHighlightLinks,
        });
      }
    };

    // None highlighted
    if (highlights.node === null) {
      d3Data.links.filter((links) => findFamilies(links, node, highlights));

      // Different node highlighted
    } else if (highlights.node !== node) {
      let tempHighlights = { node: null, family: [], links: [] };
      d3Data.links.filter((links) => findFamilies(links, node, tempHighlights));

      // Reset current node
    } else {
      setHighlights({ node: null, family: [], links: [] });
    }

    setSelectedNode(node);
  };

  // Handle touch events for mobile
  useEffect(() => {
    if (!isMobile) return;

    const canvas = fgRef.current?.renderer().domElement;
    if (!canvas) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now(),
        };
        setShowingLegend(false);
        setShowingSurnames(false);
      }
    };

    const handleTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      const currentTime = Date.now();
      const tapLength = currentTime - lastTapRef.current;
      lastTapRef.current = currentTime;
    
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
    
      // Double-tap threshold: 300ms and within 60px of the original touch
      if (tapLength < 300 && distance < 60) {
        // Use raycasting to check for intersected node
        const canvas = fgRef.current.renderer().domElement;
        const bounds = canvas.getBoundingClientRect();
    
        mouse.x = ((touch.clientX - bounds.left) / bounds.width) * 2 - 1;
        mouse.y = -((touch.clientY - bounds.top) / bounds.height) * 2 + 1;
    
        raycaster.setFromCamera(mouse, fgRef.current.camera());
        const intersects = raycaster.intersectObjects(fgRef.current.scene().children, true);
        const nodeObject = intersects.find((intersect) => intersect.object.__data);
    
        if (nodeObject) {
          const node = nodeObject.object.__data;
          if (navigator.vibrate) navigator.vibrate(25);
          handleNodeClick(node);
        } else {
          // Double tap on background clears highlights
          clearHighlights();
        }
      }
    };

    canvas.addEventListener("touchstart", handleTouchStart);
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [selectedNode]);


  // BUILD GRAPH //
  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={d3Data}
      // Display
      width={window.innerWidth}
      height={window.innerHeight}
      backgroundColor={"#010000"}
      showNavInfo={false}
      // Controls
      controlType={"orbit"}
      enableNodeDrag={false}
      onBackgroundClick={
        isMobile ? undefined : clearHighlights
      }
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
      linkColor={setLinkColor}
      linkOpacity={1}
      linkWidth={setLinkWidth}
      linkDirectionalParticles={(link) =>
        link.sourceType != "CHIL" &&
        link.targetType == "CHIL" &&
        d3Data.nodes.length < 300
          ? 8
          : 0
      }
      linkDirectionalParticleWidth={setLinkParticleWidth}
      linkDirectionalParticleSpeed={0.001}
    />
  );
};

export default Graph;

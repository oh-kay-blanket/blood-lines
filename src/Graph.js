// Modules
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { forceCollide } from 'd3-force-3d';

const Graph = ({ d3Data }) => {
  const [highlights, setHighlights] = useState({
    node: null,
    family: [],
    links: []
  });
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const fgRef = useRef();

  useEffect(() => {
    const fg = fgRef.current;
    fg.d3Force('collide', forceCollide(55));
  });

  // Resize window
  window.onresize = function(event) {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  // Camera position
  const positionCamera = useCallback(node => {
    // Aim at node from outside it
    const distance = 350;
    const distRatio = 2 + distance/Math.hypot(node.x, node.y, node.z);
    fgRef.current.cameraPosition(
      { x: node.x * distRatio, y: node.y, z: node.z * distRatio }, // new position
      node, // lookAt ({ x, y, z })
      1200  // ms transition duration
    );
  }, [fgRef]);

  // const cameraDistance = () => {
  //   const distanceRatio = (d3Data.nodes.length/2) * 15;
  //   console.log(distanceRatio);
  //   if (distanceRatio < 450) {
  //     return 450;
  //   } else if (distanceRatio > 900) {
  //     return 2000;
  //   } else {
  //     return distanceRatio;
  //   }
  // }

  // Node design
  const setNodeThreeObject = node => {
    // Use a sphere as a drag handle
    const obj = new THREE.Mesh(
      new THREE.SphereGeometry(10),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 })
    );

    // Add text sprite as child
    let name;
    if (node.firstName == '?') {
      name = node.name;
    } else {
      name = node.surname.toUpperCase() + ', ' + node.firstName;
    }
    let sprite = new SpriteText(name);

    if ((highlights.node !== null) && (highlights.family.indexOf(node.id) !== -1)) {
      sprite.color = node.color;
    } else if (highlights.node !== null) {
      sprite.color = '#222';
    } else {
      sprite.color = node.color;
    }
    sprite.background = '#555';
    sprite.textHeight = 10;
    obj.add(sprite);
    return obj;
  }

  // Node label
  const setNodeLabel = node => {

    // Label setup
    let label = '<div class="node-label">';
    // Name
    if (node.title) {
      label += '<h4>' + node.name + ' (' + node.title + ')</h4>';
    } else {
      label += '<h4>' + node.name + '</h4>';
    }
    // Lifespan
    label += '<p>' + node.yob + ' - ' + node.yod + '</p>';
    // Gender
    label += (node.gender === 'M') ? '<p>Male</p>' : '<p>Female</p>';
    // Birthplace
    if (node.pob != '') {
      label += '<p>Born: ' + node.pob + '</p>'
    }
    // Deathplace
    if (node.pod != '') {
      label += '<p>Died: ' + node.pod + '</p>'
    }
    // Bio
    if (node.bio) {
      label += '<p>' + node.bio + '</p>'
    }

    return label += '</div>';
  }

  // Handle node click
  const showFamily = (d3Data, node, highlights) => {

    const findFamilies = (links, node, highlights) => {
      if (links.source.id == node.id || links.target.id == node.id) {
        let updatedHighlightFamily = highlights.family;
        let updatedHighlightLinks = highlights.links;

        updatedHighlightFamily.push(links.target.id, links.source.id);
        updatedHighlightLinks.push(links.index);

        setHighlights({node: node, family: updatedHighlightFamily, links: updatedHighlightLinks})
      }
    }

    // None highlighted
    if (highlights.node === null) {
      d3Data.links.filter(links => findFamilies(links, node, highlights));

    // Different node highlighted
    } else if (highlights.node !== node) {
      let tempHighlights = {node: null, family: [], links: []}
      d3Data.links.filter(links => findFamilies(links, node, tempHighlights));

    // Reset current node
    } else {
      setHighlights({node: null, family: [], links: []})
    }
  }

  // Right click
  const handleRightClick = (d3Data, node, highlights) => {
    showFamily(d3Data, node, highlights);
    positionCamera(node);
  }


  // Link label
  const setLinkLabel = link => {
    // No state change
    switch(link.type) {
      case 'DIV':
        return '<div class="link-label"><p>Divorced</p></div>';
        break;
      case 'MARR':
        return '<div class="link-label"><p>Married</p></div>';
        break;
      case 'birth':
        return '<div class="link-label"><p>Birth</p></div>';
        break;
      case 'Step':
        return '<div class="link-label"><p>Step</p></div>';
        break;
      case 'Adopted':
        return '<div class="link-label"><p>Adopted</p></div>';
        break;
    }
  }

  // Link color
  const setLinkColor = link => {

    if (highlights.links.indexOf(link.index) !== -1 || highlights.links.length < 1) {
      // Parent relationship
      if (link.sourceType != 'CHIL' && link.targetType == 'CHIL') {
        return 'rgba(186, 168, 205, 0.2)';

      // Romantic relationship
      } else if (link.sourceType != 'CHIL' && link.targetType != 'CHIL') {
        return 'rgba(255, 215, 0, 0.3)';

      // Sibling relationship
      }
    } else {
      return '#333';
    }
  }

  // Link width
  const setLinkWidth = link => {
    if (highlights.links.indexOf(link.index) !== -1) {
      return 1.7;
    } else {
      return 1;
    }
  }

  // Link particles
  const setLinkParticleWidth = link => {
    if (highlights.links.indexOf(link.index) !== -1) {
      return 2;
    } else {
      return 0.1;
    }
  }

  // Remove highlights
  const clearHighlights = () => {
    setHighlights({node: null, family: [], links: []});
  }


  // Create graph
  return <ForceGraph3D
    ref={fgRef}
    graphData={d3Data}

    // Display
    width={width}
    height={height}
    backgroundColor={'#111'}
    showNavInfo={false}

    // Controls
    controlType={'orbit'}
    enableNodeDrag={false}
    onBackgroundClick={clearHighlights}
    onBackgroundRightClick={clearHighlights}

    // Nodes
    nodeLabel={setNodeLabel}
    nodeThreeObject={setNodeThreeObject}
    onNodeClick={node => showFamily(d3Data, node, highlights)}
    onNodeRightClick={node => handleRightClick(d3Data, node, highlights)}

    // LINKS
    linkLabel={setLinkLabel}
    linkColor={setLinkColor}
    linkOpacity={1}
    linkWidth={setLinkWidth}
    linkDirectionalArrowLength={link => (link.sourceType != 'CHIL' && link.targetType == 'CHIL' && d3Data.nodes.length > 300) ? 4 : 0}
    linkDirectionalParticles={link => (link.sourceType != 'CHIL' && link.targetType == 'CHIL' && d3Data.nodes.length < 300) ? 8 : 0}
    linkDirectionalParticleWidth={setLinkParticleWidth}
    linkDirectionalParticleSpeed={.001}
  />
}

export default Graph;

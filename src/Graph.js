// Modules
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { forceCollide } from 'd3-force-3d';

const Graph = ({ d3Data, highlightedFamily, setHighlightedFamily }) => {
  // console.log(d3Data);

  const [highlights, setHighlights] = useState({
    node: null,
    family: [],
    links: []
  });

  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const fgRef = useRef();

  // Manage force
  useEffect(() => {
    fgRef.current.d3Force('collide', forceCollide(55));
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

    let partOfFamily = highlightedFamily === node.surname;

    // Add text sprite as child
    let name;
    if (node.firstName == '?') {
      name = node.name;
    } else {
      name = node.surname.toUpperCase() + ', ' + node.firstName;
    }
    let sprite = new SpriteText(name);

    // NODE.COLOR
    sprite.color =
      highlights.node === null ? // No highlighted node
        highlightedFamily ?
          highlightedFamily === node.surname ?
            node.color : // Current node part of highlighted family
            '#222' : // Current node NOT part of highlighted family?
          node.color : // No highlighted family
      highlights.family.indexOf(node.id) !== -1 ?
        node.color : // Highlighted node or family
        '#222'; // Dark node

    sprite.fontFace = "Montserrat";
    sprite.fontWeight = 500;
    sprite.textHeight = 10;
    obj.add(sprite);
    return obj;
  }

  // Node label
  const setNodeLabel = node => {

    // Label setup
    let label = `<div class="node-label">`;

    // Gender
    const labelGender = (node.gender === 'M') ? `♂` : `♀`;

    // Name
    if (node.title) {
      label += `<h4 class="node-title"><span style="color:${node.color}">${node.name} (${node.title})</span> ${labelGender}</h4>`;
    } else {
      label += `<h4><span style="color:${node.color}">${node.name}</span> ${labelGender}</h4>`;
    }
    // Lifespan
    label += `<p><b>${node.yob} - ${node.yod}</b></p>`;
    // Birthplace
    if (node.pob != '') {
      label += `<p><b>From:</b> ${node.pob}</p>`
    }
    // Deathplace
    // if (node.pod != '') {
    //   label += `<p><b>Died:</b> ${node.pod}</p>`
    // }
    // Bio
    if (node.bio) {
      label += `<p>${node.bio}</p>`
    }

    return label += '</div>';
  }

  // Handle node click
  const showFamily = (d3Data, node, highlights) => {

    // Find family member of clicked node
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
      case 'Natural':
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

    return highlights.links.length < 1 ?
      highlightedFamily ?
        'rgba(186, 186, 186, 0.15)' : // Highlighed family exists, mute all links
        (link.sourceType != 'CHIL' && link.targetType != 'CHIL') ?
          'rgba(255, 215, 0, 0.6)' : // Romantic link
          'rgba(186, 186, 186, 0.15)' : // Normal link
      highlights.links.indexOf(link.index) !== -1 ?
      (link.sourceType != 'CHIL' && link.targetType != 'CHIL') ?
        'rgba(255, 215, 0, 0.6)' : // Romantic link
        'rgba(186, 186, 186, 0.15)' : // Normal link
      'rgba(186, 186, 186, 0.15)'; // Normal link

    // if (highlights.links.indexOf(link.index) !== -1 || highlights.links.length < 1) {
    //   // Parent relationship
    //   if (link.sourceType != 'CHIL' && link.targetType == 'CHIL') {
    //     return 'rgba(186, 186, 186, 0.15)';
    //
    //   // Romantic relationship
    //   } else if (link.sourceType != 'CHIL' && link.targetType != 'CHIL') {
    //     return 'rgba(255, 215, 0, 0.6)';
    //   }
    // } else {
    //   return '#333';
    // }
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
    setHighlightedFamily();
  }

  // Add timeline
  useEffect(() => {

    // Get list of fixed Y
    let yRange = d3Data.nodes.map(node => Number(node.fy));

    // Filter our NaN
    yRange = yRange.filter(node => !isNaN(node) && node);

    // TIMELINE
    const highestY = Math.max.apply(Math, yRange);
    const lowestY = Math.min.apply(Math, yRange);

    //create a blue LineBasicMaterial
    var material = new THREE.LineBasicMaterial( {
      color: 0x333333,
      linewidth: 2
    } );

    var points = [];
    points.push( new THREE.Vector3( 0, lowestY, 0 ) );
    points.push( new THREE.Vector3( 0, highestY, 0 ) );

    var geometry = new THREE.BufferGeometry().setFromPoints( points );

    var line = new THREE.Line( geometry, material );

    fgRef.current.scene().add(line);
  });

  // Add timeline YEAR
  useEffect(() => {

    // All YOBs
    let years = d3Data.nodes.map(node => Number(node.yob));

    // Filter out NaN
    years = years.filter(year => !isNaN(year));

    // Get list of fixed Y
    let yRange = d3Data.nodes.map(node => Number(node.fy));

    // Filter out NaN
    yRange = yRange.filter(node => !isNaN(node) && node);

    // TIMELINE
    const highestY = Math.max.apply(Math, yRange);
    const lowestY = Math.min.apply(Math, yRange);
    const halfY = (highestY + lowestY)/2;
    const quarterY = (halfY + lowestY)/2;
    const threeQuarterY = (halfY + highestY)/2;


    const earliestYOB = Math.min.apply(Math, years);
    const latestYOB = Math.max.apply(Math, years);
    const halfYOB = parseInt((earliestYOB + latestYOB)/2);
    const quarterYOB = parseInt((latestYOB + halfYOB)/2);
    const threeQuarterYOB = parseInt((earliestYOB + halfYOB)/2);

    // EARLIEST
    let earliest = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    earliest.position.y = highestY + 15;

    let earliestTimeLabel = earliestYOB ? new SpriteText(earliestYOB) : new SpriteText("Earlier");
    earliestTimeLabel.color = '#f8f8f8';
    earliestTimeLabel.fontFace = "Montserrat";
    earliestTimeLabel.fontWeight = 400;
    earliestTimeLabel.textHeight = 25;
    earliest.add(earliestTimeLabel);

    // LATEST
    let latest = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    latest.position.y = lowestY - 15;

    let latestTimeLabel = latestYOB ? new SpriteText(latestYOB) : new SpriteText("Later");
    latestTimeLabel.color = '#f8f8f8';
    latestTimeLabel.fontFace = "Montserrat";
    latestTimeLabel.fontWeight = 400;
    latestTimeLabel.textHeight = 25;
    latest.add(latestTimeLabel);

    // HALF
    let half = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    half.position.y = halfY;

    let halfTimeLabel = new SpriteText(halfYOB);
    halfTimeLabel.color = '#ccc';
    halfTimeLabel.fontFace = "Montserrat";
    halfTimeLabel.fontWeight = 400;
    halfTimeLabel.textHeight = 15;
    half.add(halfTimeLabel);

    // QUARTER
    let quarter = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    quarter.position.y = quarterY;

    let quarterTimeLabel = new SpriteText(quarterYOB);
    quarterTimeLabel.color = '#ccc';
    quarterTimeLabel.fontFace = "Montserrat";
    quarterTimeLabel.fontWeight = 400;
    quarterTimeLabel.textHeight = 15;
    quarter.add(quarterTimeLabel);

    // QUARTER
    let threeQuarter = new THREE.Mesh(
      new THREE.SphereGeometry(100),
      new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 }),
    );

    threeQuarter.position.y = threeQuarterY;

    let threeQuarterTimeLabel = new SpriteText(threeQuarterYOB);
    threeQuarterTimeLabel.color = '#ccc';
    threeQuarterTimeLabel.fontFace = "Montserrat";
    threeQuarterTimeLabel.fontWeight = 400;
    threeQuarterTimeLabel.textHeight = 15;
    threeQuarter.add(threeQuarterTimeLabel);

    fgRef.current.scene().add(earliest);
    fgRef.current.scene().add(latest);
    highestY-lowestY > 300 && fgRef.current.scene().add(half);
    highestY-lowestY > 450 && fgRef.current.scene().add(quarter);
    highestY-lowestY > 450 && fgRef.current.scene().add(threeQuarter);
  });

  useEffect(() => {
    fgRef.current.controls().enableDamping = true;
    fgRef.current.controls().dampingFactor = 1.3;
    fgRef.current.controls().rotateSpeed = 0.8;
    fgRef.current.controls().screenSpacePanning = true;
  })


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

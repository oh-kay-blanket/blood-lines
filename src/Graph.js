// Modules
import React, { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { forceCollide } from 'd3-force-3d';

const Graph = ({ d3Data, highlightedFamily, setHighlightedFamily, setHoveredNode }) => {

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
      name = `${node.firstName} ${node.surname}`;
    }
    let sprite = new SpriteText(name);

    // Sprite defaults
    const coloredSprite = () => {
      sprite.color = node.color;
      sprite.backgroundColor = '#000c';
      sprite.borderColor = '#555';
    }

    const greyedSprite = () => {
      sprite.color = '#3335';
      sprite.backgroundColor = '#0002';
      sprite.borderColor = '#3333';
    }

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
    sprite.borderWidth = 1;
    sprite.borderRadius = 8;
    sprite.padding = 4;
    obj.add(sprite);
    return obj;
  }

  // Node label
  const setNodeLabel = node => {

    // Label setup
    let label = `<div class="node-label">`;

    // Gender
    const labelGender = (node.gender === 'M') ? `♂` : `♀`;

    label += `<p><b>${node.yob} - ${node.yod} ${labelGender}</b></p>`;

    return label += '</div>';
  }

  // Node label
  const setNodeInfo = node => {
    setHoveredNode(node);
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

    setNodeInfo(node);
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
        'rgba(255, 153, 153, 0.2)' : // Highlighed family exists, mute all links
        (link.sourceType != 'CHIL' && link.targetType != 'CHIL') ?
          'rgba(255, 215, 0, 0.6)' : // Romantic link
          'rgba(255, 153, 153, 0.2)' : // Normal link
      highlights.links.indexOf(link.index) !== -1 ?
      (link.sourceType != 'CHIL' && link.targetType != 'CHIL') ?
        'rgba(255, 215, 0, 0.6)' : // Romantic link
        'rgba(255, 153, 153, 0.2)' : // Normal link
      'rgba(255, 153, 153, 0.02)'; // Normal link
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
    setNodeInfo();
  }

  // Add fog
  useEffect(() => {
    // console.log(d3Data.nodes.length);
    let fogNear = 1000;
    let fogFar = 8000;
    if (d3Data.nodes.length < 120) {
      fogNear = 600;
      fogFar = 4000;
    };

    const fogColor = new THREE.Color(0x111111);

    var myFog = new THREE.Fog(fogColor, fogNear, fogFar);
    var myFogg = new THREE.FogExp2(fogColor, 0.0025);

    fgRef.current.scene().fog = myFog;
  }, []);


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
  }, []);

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
    earliestTimeLabel.fontFace = "Helvetica";
    earliestTimeLabel.fontWeight = 800;
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
    latestTimeLabel.fontFace = "Helvetica";
    latestTimeLabel.fontWeight = 800;
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
    halfTimeLabel.fontFace = "Helvetica";
    halfTimeLabel.fontWeight = 800;
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
    quarterTimeLabel.fontFace = "Helvetica";
    quarterTimeLabel.fontWeight = 800;
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
    threeQuarterTimeLabel.fontFace = "Helvetica";
    threeQuarterTimeLabel.fontWeight = 800;
    threeQuarterTimeLabel.textHeight = 15;
    threeQuarter.add(threeQuarterTimeLabel);

    fgRef.current.scene().add(earliest);
    fgRef.current.scene().add(latest);
    highestY-lowestY > 300 && fgRef.current.scene().add(half);
    highestY-lowestY > 450 && fgRef.current.scene().add(quarter);
    highestY-lowestY > 450 && fgRef.current.scene().add(threeQuarter);
  }, []);

  useEffect(() => {
    fgRef.current.controls().enableDamping = true;
    fgRef.current.controls().dampingFactor = 0.3;
    fgRef.current.controls().rotateSpeed = 0.8;
    fgRef.current.controls().screenSpacePanning = true;
  }, [])


  // Create graph
  return <ForceGraph3D
    ref={fgRef}
    graphData={d3Data}

    // Display
    width={width}
    height={height}
    backgroundColor={'#010000'}
    showNavInfo={false}

    // Controls
    controlType={'orbit'}
    enableNodeDrag={false}
    onBackgroundClick={clearHighlights}
    onBackgroundRightClick={clearHighlights}

    // Nodes
    nodeLabel={setNodeLabel}
    // onNodeHover={setNodeInfo}
    nodeThreeObject={setNodeThreeObject}
    onNodeClick={node => showFamily(d3Data, node, highlights)}
    onNodeRightClick={node => handleRightClick(d3Data, node, highlights)}

    // LINKS
    linkLabel={setLinkLabel}
    linkColor={setLinkColor}
    linkOpacity={1}
    linkWidth={setLinkWidth}
    linkDirectionalParticles={link => (link.sourceType != 'CHIL' && link.targetType == 'CHIL' && d3Data.nodes.length < 300) ? 8 : 0}
    linkDirectionalParticleWidth={setLinkParticleWidth}
    linkDirectionalParticleSpeed={.001}
  />
}

export default Graph;

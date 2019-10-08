import { cameraDistance, setNodeLabel, setLinkLabel } from './graph-functions.js';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
// import * as d3 from 'd3-octree';
// import { forceCollide } from 'd3-force-3d'; // or d3-octree?

//console.log(octree);

const loadGraph = d3Data => {

  // d3Data.nodes.forEach(node => {
  //   console.log(node.name, node.yob, node.y);
  // })

  let highlightNode = null;
  let highlightFamily = [];
  let highlightLinks = [];

  // Resize window
  window.onresize = function(event) {
    Graph.width(window.innerWidth).height(window.innerHeight)
  };

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

    if ((highlightNode !== null) && (highlightFamily.indexOf(node.id) !== -1)) {
      sprite.color = node.color;
    } else if (highlightNode !== null) {
      sprite.color = '#222';
    } else {
      sprite.color = node.color;
    }
    sprite.background = '#555';
    sprite.textHeight = 10;
    obj.add(sprite);
    return obj;
  }

  const setLinkColor = link => {

    if (highlightLinks.indexOf(link.index) !== -1 || highlightLinks.length < 1) {
      // Parent relationship
      if (link.sourceType != 'CHIL' && link.targetType == 'CHIL') {
        return '#9933ff';

      // Romantic relationship
      } else if (link.sourceType != 'CHIL' && link.targetType != 'CHIL') {
        return '#ff9999';

      // Sibling relationship
      } else if (link.sourceType == 'CHIL' && link.targetType == 'CHIL'){
        return '#33cccc';
      }
    } else {
      return '#333';
    }
  }

  const setLinkWidth = link => {
    if (highlightLinks.indexOf(link.index) !== -1) {
      return 1;
    } else {
      return .5;
    }
  }

  const clearHighlights = () => {
    highlightNode = null;
    highlightFamily = [];
    highlightLinks = [];
  }

  // Create graph
  const Graph = ForceGraph3D({controlType:'orbit'}) (document.getElementById('file-display-area'))

    // SETUP
    .graphData(d3Data)
    .cameraPosition({ x: cameraDistance(d3Data), y: cameraDistance(d3Data), z: cameraDistance(d3Data) },'',1400)
    .d3Force('collide', d3.forceCollide(55))
    //.d3Force("center", d3.forceCenter())
    .enableNodeDrag(false)

    // BACKGROUND
    .backgroundColor('#111')
    .onBackgroundClick(() => {
      clearHighlights();
      updateGeometries();
    })
    .onBackgroundRightClick(() => {
      clearHighlights();
      updateGeometries();
    })

    // NODES
    .nodeLabel(setNodeLabel)
    .nodeThreeObject(setNodeThreeObject)
    .onNodeClick(node => {

      const findFamilies = links => {
        if (links.source.id == node.id || links.target.id == node.id) {
          highlightFamily.push(links.target.id);
          highlightFamily.push(links.source.id);
          highlightLinks.push(links.index);
        }
      }

      // Toggle highlighted node
      if (highlightNode === null) {
        highlightNode = node;
        d3Data.links.filter(findFamilies);
      } else if (highlightNode !== node) {
        highlightNode = node;
        highlightFamily = [];
        highlightLinks = [];
        d3Data.links.filter(findFamilies);
      } else {
        highlightNode = null;
        highlightFamily = [];
        highlightLinks = [];
      }
      updateGeometries();
    })
    .onNodeRightClick(node => {

      const findFamilies = links => {
        if (links.source.id == node.id || links.target.id == node.id) {
          highlightFamily.push(links.target.id);
          highlightFamily.push(links.source.id);
          highlightLinks.push(links.index);
        }
      }

      // Toggle highlighted node
      if (highlightNode === null) {
        highlightNode = node;
        d3Data.links.filter(findFamilies);
      } else if (highlightNode !== node) {
        highlightNode = node;
        highlightFamily = [];
        highlightLinks = [];
        d3Data.links.filter(findFamilies);
      } else if (highlightNode === node) { // do nothing
      } else {
        highlightNode = null;
        highlightFamily = [];
        highlightLinks = [];
      }
      updateGeometries();

      // Aim at node from outside it
      const distance = 200;
      const distRatio = 2 + distance/Math.hypot(node.x, node.y, node.z);
      Graph.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt ({ x, y, z })
        1200  // ms transition duration
      );
    })

    // LINKS
    .linkLabel(setLinkLabel)
    .linkColor(setLinkColor)
    .linkOpacity(.3)
    .linkWidth(setLinkWidth)
    .linkDirectionalArrowLength(link => (link.sourceType != 'CHIL' && link.targetType == 'CHIL' && d3Data.nodes.length > 300) ? 4 : 0)
    .linkDirectionalParticles(link => (link.sourceType != 'CHIL' && link.targetType == 'CHIL' && d3Data.nodes.length < 300) ? 8 : 0)
    .linkDirectionalParticleWidth(1)
    .linkDirectionalParticleSpeed(.0017);

  const updateGeometries = () => {
    Graph
    .nodeThreeObject(setNodeThreeObject)
    .linkColor(setLinkColor)
    .linkWidth(setLinkWidth)
  }
}

export { loadGraph };

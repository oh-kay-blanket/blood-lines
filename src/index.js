import { htmlTemplate } from './htmlTemplate';
import './style.css';
import backButton from './back-button.png';

import ForceGraph3D from '3d-force-graph';
import { parse, d3ize } from 'gedcom-d3';
import { loadGraph } from './graph.js';

// GEDOM files
import shakespeareFile from './gedcoms/shakespeare.ged';
import tudorFile from './gedcoms/tudors.ged';
import gotFile from './gedcoms/GOT.ged';
import kardashianFile from './gedcoms/kardashian.ged';

const readFile = file => {
  const d3Data = d3ize(parse(file));  // Parse data
  loadGraph(d3Data);  // Load graph
  formatViewer(); // Remove scroll, add buttons
}

// Export to window
window.readFile = readFile;
window.shakespeareFile = shakespeareFile;
window.tudorFile = tudorFile;
window.gotFile = gotFile;
window.kardashianFile = kardashianFile;

const scriptOne = () => {
  const script = document.createElement('script');

  script.type = 'text/javascript';
  script.src = 'https://unpkg.com/d3-octree';

  return script;
}

const scriptTwo = () => {
  const script = document.createElement('script');

  script.type = 'text/javascript';
  script.src = 'https://unpkg.com/d3-force-3d';

  return script;
}

const component = () => {
  const element = document.createElement('div');

  element.innerHTML = htmlTemplate();

  return element;
}

document.body.appendChild(scriptOne());
document.body.appendChild(scriptTwo());
document.body.appendChild(component());

const formatViewer = () => {
  document.body.style.overflowY = 'hidden';
  document.body.style.overflowX = 'hidden';
  document.getElementById("controls").innerHTML += `
    <div id="back-button" onClick="location.reload();">
      <img src=${backButton}>
    </div>`;
}


// Listener for file load
window.onload = () => {
  const fileInput = document.getElementById('file-input');
  const fileDisplayArea = document.getElementById('file-display-area');

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    console.log(file.type);

      const reader = new FileReader();

      reader.onload = () => {
        readFile(reader.result)
      }
      reader.readAsText(file);

  });
}

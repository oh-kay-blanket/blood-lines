// Modules
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { parse, d3ize } from 'gedcom-d3';

// Components
import Load from './Load';
import Controls from './Controls';
import Graph from './Graph';

// Style
import './sass/style.scss';

// GEDOM files
import halflingFile from './gedcoms/halfling.ged';
import kennedyFile from './gedcoms/kennedy.ged';
import shakespeareFile from './gedcoms/shakespeare.ged';
import tudorFile from './gedcoms/tudors.ged';
import plunkettFile from './gedcoms/plunkett_ancestry.ged';
import kardashianFile from './gedcoms/kardashian.ged';

const App = () => {

  console.log("rendering app");

  const [showingRoots, setShowingRoots] = useState(false);
  const [d3Data, setD3Data] = useState([]);
  const [showError, setShowError] = useState(false);
  const [highlightedFamily, setHighlightedFamily] = useState();
  const [selectedNode, setSelectedNode] = useState(null);
  const [showingLegend, setShowingLegend] = useState(false);
  const [showingSurnames, setShowingSurnames] = useState(false);
  const [highlights, setHighlights] = useState({ node: null, family: [], links: [] });
  const isMobile = window.innerWidth < 769;

  const readFile = file => {
    setD3Data(d3ize(parse(file)));  // Parse data
    setShowingRoots(true);
    setShowError(false);
  }

  const closeRoots = () => {
    setShowingRoots(false);
    setHighlightedFamily();
    setD3Data([]);
  }

  const handleUpload = event => {
    const file = event.target.files[0];
    const parts = file.name.split('.');
    const reader = new FileReader(file);

    if (parts[parts.length -1].toLowerCase() === 'ged') {
      reader.onloadend = () => {
        readFile(reader.result);
      }
      reader.readAsText(file);
    } else {
      reader.readAsText(file);
      setShowError(true);
    }
  }

  return(
    <>
      {!showingRoots ?
        <Load
          handleUpload={handleUpload}
          loadHalfling={() => readFile(halflingFile)}
          loadKennedy={() => readFile(kennedyFile)}
          loadShakespeare={() => readFile(shakespeareFile)}
          loadTudor={() => readFile(tudorFile)}
          loadPlunkett={() => readFile(plunkettFile)}
          loadKardashian={() => readFile(kardashianFile)}
          showError={showError}
        /> :
        <>
          <Controls
            d3Data={d3Data}
            closeRoots={closeRoots}
            highlightedFamily={highlightedFamily}
            setHighlightedFamily={setHighlightedFamily}
            selectedNode={selectedNode}
            showingLegend={showingLegend}
            setShowingLegend={setShowingLegend}
            showingSurnames={showingSurnames}
            setShowingSurnames={setShowingSurnames}
            isMobile={isMobile}
          />
          <Graph
            d3Data={d3Data}
            highlights={highlights}
            setHighlights={setHighlights}
            highlightedFamily={highlightedFamily}
            setHighlightedFamily={setHighlightedFamily}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            showingLegend={showingLegend}
            setShowingLegend={setShowingLegend}
            showingSurnames={showingSurnames}
            setShowingSurnames={setShowingSurnames}
            isMobile={isMobile}
          />
        </>
      }
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'));

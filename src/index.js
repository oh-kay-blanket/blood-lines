// Modules
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { parse, d3ize } from 'gedcom-d3';
import Graph from './graph.js';

// Style
import './style.css';
import backButton from './back-button.png';

// GEDOM files
import ancestorsFile from './gedcoms/sample_ancestors.ged';
import relativesFile from './gedcoms/sample_related.ged';
import shakespeareFile from './gedcoms/shakespeare.ged';
import tudorFile from './gedcoms/tudors.ged';
import gotFile from './gedcoms/GOT.ged';
import kardashianFile from './gedcoms/kardashian.ged';

const App = () => {

  const [showingRoots, setShowingRoots] = useState(false);
  const [d3Data, setD3Data] = useState([]);
  const [showError, setShowError] = useState(false);

  const readFile = file => {
    setD3Data(d3ize(parse(file)));  // Parse data
    setShowingRoots(true);
    setShowError(false);
  }

  const loadAncestors = () => {
    readFile(ancestorsFile);
  }

  const loadRelatives = () => {
    readFile(relativesFile);
  }

  const loadShakespeare = () => {
    readFile(shakespeareFile);
  }

  const loadTudor = () => {
    readFile(tudorFile);
  }

  const loadGOT = () => {
    readFile(gotFile);
  }

  const loadKardashian = () => {
    readFile(kardashianFile);
  }

  const closeRoots = () => {
    setShowingRoots(false);
    setD3Data([]);
  }

  const handleUpload = event => {
    const file = event.target.files[0];
    const parts = file.name.split('.');

    if (parts[parts.length -1].toLowerCase() === 'ged') {
      const reader = new FileReader();

      reader.onload = () => {
        readFile(reader.result)
      }
      reader.readAsText(file);
    } else {
      setShowError(true);
    }
  }

  return(
    <>
      <Load showingRoots={showingRoots} handleUpload={handleUpload} loadAncestors={loadAncestors} loadRelatives={loadRelatives} loadShakespeare={loadShakespeare} loadTudor={loadTudor} loadGOT={loadGOT} loadKardashian={loadKardashian} showError={showError} />
      <Controls showingRoots={showingRoots} closeRoots={closeRoots} />
      <Roots showingRoots={showingRoots} d3Data={d3Data} />
    </>
  )
}

const Load = ({ showingRoots, handleUpload, loadAncestors, loadRelatives, loadShakespeare, loadTudor, loadGOT, loadKardashian, showError }) => {
  if (!showingRoots) {
    return (
      <div id='load'>
        <div id='title-area'>
          <h1>Roots</h1>
          <h3>A 3D family tree visualizer.</h3>
        </div>

        <div id='upload-area'>
          <p>If you have a GEDCOM (.ged) file, upload it to see your roots. </p>
          { showError ? <p id='error'>File type not supported. Please use a .ged file.</p> : null}
          <input id='file-input' className='form-control' type='file' name='gedFile' onChange={handleUpload} />
        </div>

        <div id='button-area'>
          <p>If you don't have a GEDCOM file, have a look at some example roots.</p>
          <SampleButton
            name={'Ancestor Sample'}
            loadFile={loadAncestors}
          />
          <SampleButton
            name={'Relatives Sample'}
            loadFile={loadRelatives}
          />
          <SampleButton
            name={'Shakespeare Roots'}
            loadFile={loadShakespeare}
          />
          <SampleButton
            name={'Kardashian Roots'}
            loadFile={loadKardashian}
          />
          <SampleButton
            name={'Tudor Roots'}
            loadFile={loadTudor}
          />
          <SampleButton
            name={'Game of Thrones Roots'}
            loadFile={loadGOT}
          />
        </div>

        <div id='documentation-area'>
          <p><a href='https://github.com/mister-blanket/kin-cloud'>Documentation</a> on GitHub</p>
          <p><a href='https://mrplunkett.com'>Mr. Plunkett</a></p>
        </div>
      </div>
    );
  } else {
    return null;
  }
}

const SampleButton = ({ name, loadFile }) => {
  return(
    <input className='sampleButton' type='button' value={name} onClick={loadFile} />
  )
}

const Controls = ({ showingRoots, closeRoots }) => {
  if (showingRoots) {
    return (
      <div id='controls'>
        <div id="back-button" onClick={closeRoots}>
          <img src={backButton} />
        </div>
      </div>
    )
  } else {
    return null;
  }
}

const Roots = ({ showingRoots, d3Data }) => {
  if (showingRoots) {
    return (
      <div id='roots-area'>
        <Graph d3Data={d3Data} />
      </div>);
  } else {
    return null;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

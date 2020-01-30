import React, {useState} from "react";

import backButton from './back-button.png';

const Controls = ({ closeRoots }) => {

  const [showingLegend, setShowingLegend] = useState(false);

  const toggleLegend = () => {
    setShowingLegend(prevState => !prevState);
  }

  return (
    <div id='controls'>
      <div id="back-button" onClick={closeRoots}>
        <img src={backButton} />
      </div>
      <div id="legend">
        {showingLegend &&
          <div id="legend-content">
            <h2>Legend</h2>
            <p>Grey line: Parental link</p>
            <p>Gold line: Romantic link</p>

            <h2>Controls</h2>
            <p>Zoom: Mouse wheel</p>
            <p>Spin: Left-drag</p>
            <p>Pan: Right-drag</p>
            <p>Person Info: Hover over name</p>
            <p>Relationship Info: Hover over line</p>
            <p>Highlight Person: Left-click name</p>
            <p>Center on Person: Right-click name</p>
          </div>
        }
        <p id="legend-button" onClick={toggleLegend}>{showingLegend ? 'Hide' : 'Info'}</p>
      </div>
    </div>
  )
}

export default Controls;

import React, {useState} from "react";

import backButton from './img/back-button.png';
import greyLine from './img/grey-line.png';
import goldLine from './img/gold-line.png';

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
            <div className="legend-line">
              <img src={greyLine} />
              <p>- Parental link</p>
            </div>
            <div className="legend-line">
              <img src={goldLine} />
              <p>- Romantic link</p>
            </div>

            <h2>Controls</h2>
            <p><b>Scroll</b> - Zoom</p>
            <p><b>Left drag</b> - Spin</p>
            <p><b>Right drag</b> - Pan</p>
            <p><b>Hover over name</b> - Person info</p>
            <p><b>Hover over line</b> - Relationship info</p>
            <p><b>Left-click name</b> - Highlight</p>
            <p><b>Right-click name</b> Re-center</p>
          </div>
        }
        <p id="legend-button" onClick={toggleLegend}>{showingLegend ? 'Hide ▼' : 'Info ▲'}</p>
      </div>
    </div>
  )
}

export default Controls;

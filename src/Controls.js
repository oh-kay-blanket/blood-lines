import React from "react";

import backButton from './back-button.png';

const Controls = ({ closeRoots, showingLegend, setShowingLegend }) => {
  return (
    <div id='controls'>
      <div id="back-button" onClick={closeRoots}>
        <img src={backButton} />
      </div>
      <div id="legend">
        <p onClick={() => setShowingLegend(true)}>Legend</p>
        {showingLegend &&
          <p>here's some more</p>
        }
      </div>
    </div>
  )
}

export default Controls;

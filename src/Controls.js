import React, {useState} from "react";

import backButton from './img/back-button.png';
import greyLine from './img/grey-line.png';
import goldLine from './img/gold-line.png';

const Controls = ({ d3Data, closeRoots, setTimelineShowing, highlightedFamily, setHighlightedFamily }) => {

  const [showingLegend, setShowingLegend] = useState(false);
  const [showingsurnames, setShowingsurnames] = useState(false);

  const toggleLegend = () => {
    setShowingLegend(prevState => !prevState);
  }

  const toggleSurnames = () => {
    setShowingsurnames(prevState => !prevState);
  }

  const handleClick = () => {
    setTimelineShowing(prevState => !prevState)
  }

  function compareSurname( a, b ) {
    if ( a.surname < b.surname ){
      return -1;
    }
    if ( a.surname > b.surname ){
      return 1;
    }
    return 0;
  }

  function compareCount( a, b ) {
    if ( a.count < b.count ){
      return 1;
    }
    if ( a.count > b.count ){
      return -1;
    }
    return 0;
  }
  console.log(d3Data.surnameList)
  const surnameList = d3Data.surnameList.filter(name => name.surname !== "").sort(compareSurname).sort(compareCount).map((family, index) =>
    <p
      key={index}
      style={{color: !highlightedFamily ? family.color : highlightedFamily === family.surname ? family.color : '#333'}}
      onClick={e => highlightedFamily === family.surname ? setHighlightedFamily() : setHighlightedFamily(family.surname) }>
      {family.surname} ({family.count})
    </p>
  );

  return (
    <div id='controls'>
      <div id="back-button" onClick={closeRoots}>
        <img src={backButton} />
      </div>

      <div id="legend">
        {showingLegend &&
          <div id="legend-content">
            <h2 onClick={handleClick}>Legend</h2>
            <div className="legend-line">
              <img src={greyLine} />
              <p>- Parental link</p>
            </div>
            <div className="legend-line">
              <img src={goldLine} />
              <p>- Romantic link</p>
            </div>
            <hr/>

            <h2>Controls</h2>
            <p><b>Hover over name</b> - Person info</p>
            <p><b>Hover over line</b> - Relationship info</p>
            <p><b>Left-click name</b> - Highlight</p>
            <p><b>Right-click name</b> - Re-center</p>
            <p><b>Scroll</b> - Zoom</p>
            <p><b>Left drag</b> - Spin</p>
            <p><b>Right drag</b> - Pan</p>

          </div>
        }
        <p id="legend-button" onClick={toggleLegend}>{showingLegend ? 'Hide ▼' : 'Info ▲'}</p>
      </div>

      <div id="surnames">
        {showingsurnames &&
          <>
            <div className="surnames-heading">
              <h2>Surnames</h2>
              <p>Click name to toggle highlight</p>
            </div>
            <div className="surnames-content">
              {surnameList}
            </div>
          </>
        }
        <p id="surnames-button" onClick={toggleSurnames}>{showingsurnames ? 'Hide ▼' : 'Surnames ▲'}</p>
      </div>
    </div>
  )
}

export default Controls;

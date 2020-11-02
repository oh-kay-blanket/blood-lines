import React, {useState} from "react";

import greyLine from './img/grey-line.png';
import goldLine from './img/gold-line.png';

const Controls = ({ d3Data, closeRoots, setTimelineShowing, highlightedFamily, setHighlightedFamily }) => {

  const [showingLegend, setShowingLegend] = useState(false);
  const [showingsurnames, setShowingsurnames] = useState(false);

  const toggleLegend = () => {
    setShowingLegend(prevState => !prevState);
    setShowingsurnames(false);
  }

  const toggleSurnames = () => {
    setShowingsurnames(prevState => !prevState);
    setShowingLegend(false);
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

  const surnameList = d3Data.surnameList.filter(name => name.surname !== "").sort(compareSurname).sort(compareCount).map((family, index) =>
    <p
      key={index}
      style={{color: !highlightedFamily ? family.color : highlightedFamily === family.surname ? family.color : '#333', cursor: 'pointer'}}
      onClick={e => highlightedFamily === family.surname ? setHighlightedFamily() : setHighlightedFamily(family.surname) }>
      {family.surname} ({family.count})
    </p>
  );

  return (
    <div id='controls'>
      <div id="back-button" onClick={closeRoots}>
        <i className="fa fa-times" aria-hidden="true"></i>
      </div>

      <div id="legend">
        {showingLegend &&
          <div id="legend-content">
            <h2 onClick={handleClick}>Legend</h2>
            <div className="legend-line">
              <img src={greyLine} />
              <p>- Blood line</p>
            </div>
            <div className="legend-line">
              <img src={goldLine} />
              <p>- Love line</p>
            </div>

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
        <p id="legend-button" className={showingLegend && 'active'} onClick={toggleLegend}>{'Info'}</p>
      </div>

      <div id="surnames">
        {showingsurnames &&
          <>
            <div className="surnames-heading">
              <h2>Names</h2>
              <p>Click name to toggle highlight</p>
            </div>
            <div className="surnames-content">
              {surnameList}
            </div>
          </>
        }
        <p id="surnames-button" className={showingsurnames && 'active'} onClick={toggleSurnames}>{'Names'}</p>
      </div>
    </div>
  )
}

export default Controls;

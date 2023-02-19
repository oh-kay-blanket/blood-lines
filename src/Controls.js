import React, {useState} from "react";

import greyLine from './img/grey-line.png';
import goldLine from './img/gold-line.png';

const Controls = ({ d3Data, closeRoots, setTimelineShowing, highlightedFamily, setHighlightedFamily, hoveredNode}) => {

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

  const nodeInfoInsert = (node) => {      

    // Gender
    const labelGender = (node.gender === 'M') ? `♂` : `♀`;

    return (
      <div id="node-info--content">
        {node.title ? <h4 class="node-title"><span style={{color:node.color}}>{node.name} ({node.title})</span> {labelGender}</h4> :
          <h4><span style={{color:node.color}}>{node.name}</span> {labelGender}</h4>}
        <p><b>{node.yob} - {node.yod}</b></p>
        {node.pob != '' && <p><b>From:</b> {node.pob}</p>}
        {node.pod != '' && <p><b>Died:</b> {node.pod}</p>}
        {node.bio && <p>{node.bio}</p>}
      </div>
    );    
  }
  

  return (
    <div id='controls'>
      <div id="back-button" onClick={closeRoots}>
        <i className="fa fa-times" aria-hidden="true"></i>
      </div>

      <div id="legend">
        {showingLegend &&
          <div id="legend-content">
            <h2 onClick={handleClick}>legend</h2>
            <div className="legend-line">
              <img src={greyLine} />
              <p>- Blood line</p>
            </div>
            <div className="legend-line">
              <img src={goldLine} />
              <p>- Love line</p>
            </div>

            <h2>controls</h2>
            <p><b>Hover over name</b> - Person info</p>
            <p><b>Hover over line</b> - Relationship info</p>
            <p><b>Left-click name</b> - Highlight</p>
            <p><b>Right-click name</b> - Re-center</p>
            <p><b>Scroll</b> - Zoom</p>
            <p><b>Left drag</b> - Spin</p>
            <p><b>Right drag</b> - Pan</p>

          </div>
        }
        <p id="legend-button" className={showingLegend && 'active'} onClick={toggleLegend}>{'info'}</p>
      </div>

      <div id="node-info">
        {!!hoveredNode && nodeInfoInsert(hoveredNode)}
      </div>

      <div id="surnames">
        {showingsurnames &&
          <>
            <div className="surnames-heading">
              <h2>names</h2>
              <p>click name to toggle highlight</p>
            </div>
            <div className="surnames-content">
              {surnameList}
            </div>
          </>
        }
        <p id="surnames-button" className={showingsurnames && 'active'} onClick={toggleSurnames}>{'names'}</p>
      </div>
    </div>
  )
}

export default Controls;

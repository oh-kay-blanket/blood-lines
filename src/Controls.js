import React, {useState} from "react";

import greyLine from './img/grey-line.png';
import goldLine from './img/gold-line.png';

const Controls = ({ d3Data, closeRoots, highlightedFamily, setHighlightedFamily, selectedNode, showingLegend, setShowingLegend, showingSurnames, setShowingSurnames, isMobile }) => {

  const toggleLegend = () => {
    setShowingLegend(prevState => !prevState);
    setShowingSurnames(false);
  }

  const toggleSurnames = () => {
    setShowingSurnames(prevState => !prevState);
    setShowingLegend(false);
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
      style={{color: !highlightedFamily ? family.color : highlightedFamily === family.surname ? family.color : '#ccc', cursor: 'pointer'}}
      onClick={e => highlightedFamily === family.surname ? setHighlightedFamily() : setHighlightedFamily(family.surname) }>
      {family.surname} ({family.count})
    </p>
  );

  const nodeInfoInsert = (node) => {      

    // Gender
    const labelGender = (node.gender === 'M') ? `♂` : `♀`;

    return (
      <div id="node-info--content">
        {node.title ? <h4 className="node-title"><span style={{color:node.color}}>{node.name} ({node.title})</span> {labelGender}</h4> :
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
            <p className='control-title'>controls</p>
            {isMobile ?
              <>
                <p>tap on name: person info</p>
                <p>pinch: zoom</p>
                <p>swipe: rotate</p>
                <p>two-finger swipe: pan</p>
              </>
              :
              <>
                <p>click on name: person info</p>
                <p>scroll: zoom</p>
                <p>left-click drag: rotate</p>
                <p>right-click drag: pan</p>
              </>
            }

            <br/>
            
            <p className='control-title'>legend</p>
            <div className="legend-line">
              <img src={greyLine} />
              <p>- blood line</p>
            </div>
            <div className="legend-line">
              <img src={goldLine} />
              <p>- love line</p>
            </div>
          </div>
        }
        <p id="legend-button" className={showingLegend ? 'active' : ''} onClick={toggleLegend}>{'info'}</p>
      </div>

      <div id="node-info">
        {!!selectedNode && nodeInfoInsert(selectedNode)}
      </div>

      <div id="surnames">
        {showingSurnames &&
          <div className="surnames-content">
            {surnameList}
          </div>
        }
        <p id="surnames-button" className={showingSurnames ? 'active' : ''} onClick={toggleSurnames}>{'names'}</p>
      </div>
    </div>
  )
}

export default Controls;

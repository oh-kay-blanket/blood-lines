import React from "react";

const SampleButton = ({ name, loadFile }) => {
  return(
    <input className='sampleButton' type='button' value={name} onClick={loadFile} />
  )
}

export default SampleButton

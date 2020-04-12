import React from "react";
import SampleButton from './SampleButton';

const Load = ({ handleUpload, loadAncestors, loadRelatives, loadShakespeare, loadTudor, loadGOT, loadKardashian, showError }) => {
  return (
    <div id='load'>
      <div id='title-area'>
        <h1>Roots</h1>
        <h3>A 3D family tree visualizer</h3>
      </div>

      <div id='button-area'>
        <p>View some example roots.</p>
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
      </div>

      <div id='upload-area'>
        <p>If you have your own GEDCOM (.ged) file, upload it to see your roots.</p>
        { showError ? <p id='error'>File type not supported. Please use a .ged file.</p> : null}
        <input id='file-input' className='form-control' type='file' name='gedFile' onChange={handleUpload} />
      </div>

      <div id='documentation-area'>
        <p><a href='https://github.com/mister-blanket/kin-cloud'>Documentation</a> on GitHub</p>
        <p><a href='https://mrplunkett.com'>Mr. Plunkett</a></p>
      </div>
    </div>
  )
}

export default Load;

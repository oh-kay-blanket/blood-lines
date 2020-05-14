import React from "react";
import SampleButton from './SampleButton';

const Load = ({ handleUpload, loadHalfling, loadKennedy, loadShakespeare, loadTudor, loadGOT, loadKardashian, showError }) => {
  return (
    <div id='load'>
      <div id='title-area'>
        <h1>Blood Lines</h1>
        <h3>A 3D visualizer for genealogical data</h3>
      </div>

      <div id='button-area'>
        <p>View some sample blood lines</p>
        <SampleButton
        name={'Shakespeare'}
        loadFile={loadShakespeare}
        />
        <SampleButton
        name={'Kardashian'}
        loadFile={loadKardashian}
        />
        <SampleButton
          name={'Kennedy'}
          loadFile={loadKennedy}
        />
        <SampleButton
        name={'Halfling'}
        loadFile={loadHalfling}
        />
        <SampleButton
          name={'Tudor'}
          loadFile={loadTudor}
        />
      </div>

      <div id='upload-area'>
        <p>If you have your own GEDCOM (.ged) file, upload it to see your blood lines</p>
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

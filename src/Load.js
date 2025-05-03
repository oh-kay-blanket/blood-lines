import React from "react";
import SampleButton from './SampleButton';

const Load = ({ handleUpload, loadHalfling, loadKennedy, loadShakespeare, loadTudor, loadPlunkett, loadKardashian, showError }) => {
  return (
    <div id='load'>
      <div>
        <section className="title-area">
          <h1>blood lines</h1>
          <p>A 3D visualizer for genealogical data</p>
        </section>

        <section className='sample-area'>
          <h2>View samples</h2>
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
		      <SampleButton
            name={'Plunkett'}
            loadFile={loadPlunkett}
          />
        </section>

        <section className="load-area">
          <h2>Upload a GEDCOM (.ged) file</h2>
          { showError ? <p className='error'>File type not supported. Please use a .ged file.</p> : null}
          <input id='file-input' className='form-control' type='file' name='gedFile' onChange={handleUpload} />
        </section>

        <section className='links-area'>
          <p><a href='https://github.com/oh-kay-blanket/blood-lines'>documentation</a></p>
          <p><a href='https://ohkayblanket.com'>ohkayblanket.com</a></p>
        </section>
      </div>
    </div>
  )
}

export default Load;

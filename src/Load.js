import React from "react";
import SampleButton from './SampleButton';

const Load = ({ handleUpload, loadHalfling, loadKennedy, loadShakespeare, loadTudor, loadPlunkett, loadKardashian, showError }) => {
  return (
    <div id='load'>
      <div>
        <section className="title-area">
          <h1>blood lines</h1>
          <p>a 3D visualizer for genealogical data</p>
        </section>

        <section className='sample-area'>
          <h2>view samples</h2>
          <SampleButton
          name={'shakespeare'}
          loadFile={loadShakespeare}
          />
          <SampleButton
          name={'kardashian'}
          loadFile={loadKardashian}
          />
          <SampleButton
            name={'kennedy'}
            loadFile={loadKennedy}
          />
          <SampleButton
          name={'halfling'}
          loadFile={loadHalfling}
          />
          <SampleButton
            name={'tudor'}
            loadFile={loadTudor}
          />
		      <SampleButton
            name={'plunkett'}
            loadFile={loadPlunkett}
          />
        </section>

        <section className="load-area">
          <h2>upload a gedcom (.ged) file</h2>
          { showError ? <p className='error'>file type not supported. please use a .ged file.</p> : null}
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

import React from "react";
import SampleButton from './SampleButton';

const Load = ({ handleUpload, loadHalfling, loadKennedy, loadShakespeare, loadTudor, loadPlunkett, loadKardashian, loadBach, loadPotter, loadRoyal, loadTolkien, loadWashington, loadGreekGods, loadRomanGods, showError }) => {
  return (
    <div id='load'>
      <div>
        <section className="title-area">
          <h1>blood lines</h1>
          <p>a 3D visualizer for genealogical data</p>
        </section>

        <section className="load-area">
          <h2>upload a gedcom (.ged) file</h2>
          { showError ? <p className='error'>file type not supported. please use a .ged file.</p> : null}
          <input id='file-input' className='form-control' type='file' name='gedFile' onChange={handleUpload} />
        </section>

        <section className='sample-area'>
          <h2>view samples</h2>
          <SampleButton
          name={'kardashian'}
          loadFile={loadKardashian}
          />
          <SampleButton
            name={'shakespeare'}
            loadFile={loadShakespeare}
          />
          <SampleButton
            name={'kennedy'}
            loadFile={loadKennedy}
          />
          <SampleButton
            name={'bach'}
            loadFile={loadBach}
          />
          <SampleButton
            name={'tolkien'}
            loadFile={loadTolkien}
          />
          <SampleButton
            name={'washington'}
            loadFile={loadWashington}
          />
          <SampleButton
            name={'greek gods'}
            loadFile={loadGreekGods}
          />
          <SampleButton
            name={'roman gods'}
            loadFile={loadRomanGods}
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
            name={'potter'}
            loadFile={loadPotter}
          />
          <SampleButton
            name={'royal'}
            loadFile={loadRoyal}
          />
		      <SampleButton
            name={'plunkett'}
            loadFile={loadPlunkett}
          />
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

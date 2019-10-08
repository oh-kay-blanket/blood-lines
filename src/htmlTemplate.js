 const htmlTemplate = () => {
  return `
    <div id='controls'>
    </div>
    <div id='file-display-area'>
      <div id='title-area'>
        <h1>Kin Cloud</h1>
        <h3>Kin Cloud is an interactive 3D family tree visualizer.<br>If you have a GEDCOM (.ged) file, upload it below to view your Kin Cloud.</h3>
      </div>

      <div id='upload-area'>
        <p>Upload GEDCOM (.ged) file: </p>
        <input id='file-input' class='form-control' type='file' name='gedFile'>
      </div>

      <div id='button-area'>
        <p>If you don't have a GEDCOM file, have a look at some example Kin Clouds.</p>
        <input id='sampleButton' type='button' value='Shakespeare' onClick='readFile(shakespeareFile)'>
        <input id='sampleButton' type='button' value='Tudor' onClick='readFile(tudorFile)'>
        <input id='sampleButton' type='button' value='Game of Thrones' onClick='readFile(gotFile)'>
        <input id='sampleButton' type='button' value='Kardashian' onClick='readFile(kardashianFile)'>
      </div>

      <div id='documentation-area'>
        <p><a href='https://github.com/mister-blanket/kin-cloud'>Documentation</a> on GitHub</p>
        <p>By <a href='https://mrplunkett.com'>Mr. Plunkett</a></p>
      </div>
    </div>
  `;
}

export { htmlTemplate }

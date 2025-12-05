import React, { useState } from 'react'
import SampleButton from './SampleButton'

const Load = ({
	handleUpload,
	loadHalfling,
	loadKennedy,
	loadShakespeare,
	loadTudor,
	loadPlunkett,
	loadKardashian,
	loadBach,
	loadPotter,
	loadRoyal,
	loadTolkien,
	loadWashington,
	loadGreekGods,
	loadRomanGods,
	showError,
	theme,
	toggleTheme,
}) => {
	const [showGedcomModal, setShowGedcomModal] = useState(false)

	return (
		<>
			<div id='load'>
				<div>
					<section className='title-area'>
						<h1>blood lines</h1>
						<p>a 3D visualizer for genealogical data</p>
					</section>

					<section className='load-area'>
						<div className='heading-with-info'>
							<h2>upload a gedcom ( .ged) file</h2>
							<button
								className='info-icon'
								onClick={() => setShowGedcomModal(true)}
								aria-label='What is a GEDCOM file?'
							>
								i
							</button>
						</div>
						{showError ? (
							<p className='error'>
								file type not supported. please use a .ged file.
							</p>
						) : null}
						<input
							id='file-input'
							className='form-control'
							type='file'
							name='gedFile'
							onChange={handleUpload}
						/>
					</section>

					<section className='sample-area'>
						<h2>view samples</h2>
						<SampleButton name={'kardashian'} loadFile={loadKardashian} />
						<SampleButton name={'shakespeare'} loadFile={loadShakespeare} />
						<SampleButton name={'kennedy'} loadFile={loadKennedy} />
						<SampleButton name={'bach'} loadFile={loadBach} />
						<SampleButton name={'tolkien'} loadFile={loadTolkien} />
						<SampleButton name={'washington'} loadFile={loadWashington} />
						<SampleButton name={'greek gods'} loadFile={loadGreekGods} />
						<SampleButton name={'roman gods'} loadFile={loadRomanGods} />
						<SampleButton name={'halfling'} loadFile={loadHalfling} />
						<SampleButton name={'tudor'} loadFile={loadTudor} />
						<SampleButton name={'potter'} loadFile={loadPotter} />
						<SampleButton name={'royal'} loadFile={loadRoyal} />
						<SampleButton name={'plunkett'} loadFile={loadPlunkett} />
					</section>

					<section className='links-area'>
						<p>
							<a href='https://ohkayblanket.com'>ohkayblanket.com</a>
						</p>
						<p>
							<a href='https://github.com/oh-kay-blanket/blood-lines'>
								github
							</a>
						</p>
					</section>
				</div>
			</div>

			{showGedcomModal && (
				<div className='modal-overlay' onClick={() => setShowGedcomModal(false)}>
					<div className='modal-content' onClick={(e) => e.stopPropagation()}>
						<button className='modal-close' onClick={() => setShowGedcomModal(false)}>
							×
						</button>
						<h2>what is a GEDCOM file?</h2>
						<p>
							<strong>GEDCOM</strong> (Genealogical Data Communication) is a standard file format
							for exchanging genealogical data between different family tree software programs.
						</p>
						<p>
							GEDCOM files have a <strong>.ged</strong> extension and contain information about
							individuals, families, relationships, birth dates, death dates, and other genealogical data.
						</p>

						<h3>how to create a GEDCOM file</h3>
						<p>Most family tree software can export your data as a GEDCOM file:</p>

						<div className='gedcom-programs'>
							<div className='program'>
								<strong>Ancestry</strong>
								<p>Trees → Settings → Export tree → Download GEDCOM file</p>
							</div>

							<div className='program'>
								<strong>MyHeritage</strong>
								<p>Family Tree → Manage tree → Export to GEDCOM</p>
							</div>

							<div className='program'>
								<strong>FamilySearch</strong>
								<p>Family Tree → Download → GEDCOM</p>
							</div>

							<div className='program'>
								<strong>Legacy Family Tree</strong>
								<p>File → Export → GEDCOM File</p>
							</div>

							<div className='program'>
								<strong>Gramps</strong>
								<p>Family Trees → Export → GEDCOM</p>
							</div>

							<div className='program'>
								<strong>RootsMagic</strong>
								<p>File → Export → Individual or Family</p>
							</div>
						</div>

						<p className='modal-note'>
							Once you have your GEDCOM file, simply upload it using the file selector above
							to visualize your family tree in 3D.
						</p>
					</div>
				</div>
			)}
		</>
	)
}

export default Load

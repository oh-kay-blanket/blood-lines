// Modules
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { parse, d3ize } from 'gedcom-d3'

// Components
import Load from './Load'
import Controls from './Controls'
import Graph from './Graph'

// Style
import './sass/style.scss'

// GEDOM files
import halflingFile from './gedcoms/halfling.ged'
import kennedyFile from './gedcoms/kennedy.ged'
import shakespeareFile from './gedcoms/shakespeare.ged'
import tudorFile from './gedcoms/tudors.ged'
import plunkettFile from './gedcoms/plunkett_ancestry.ged'
import kardashianFile from './gedcoms/kardashian.ged'
import bachFile from './gedcoms/bach.ged'
import potterFile from './gedcoms/potter.ged'
import royalFile from './gedcoms/royal-family.ged'
import tolkienFile from './gedcoms/tolkien.ged'
import washingtonFile from './gedcoms/washington.ged'
import grekGodsFile from './gedcoms/greek-gods.ged'
import romanGodsFile from './gedcoms/roman-gods.ged'

// ThemeToggle component
const ThemeToggle = ({ theme, toggleTheme }) => (
	<button
		className='theme-toggle-slider'
		onClick={toggleTheme}
		aria-label='Toggle color mode'
	>
		<span
			className={theme === 'dark' ? 'active' : ''}
			role='img'
			aria-label='Dark'
		>
			🌙
		</span>
		<span
			className={theme === 'light' ? 'active' : ''}
			role='img'
			aria-label='Light'
		>
			☀️
		</span>
		<span className='slider' style={{ left: theme === 'dark' ? 0 : 30 }}></span>
	</button>
)

const App = () => {
	// console.log('rendering app')

	const [showingRoots, setShowingRoots] = useState(false)
	const [d3Data, setD3Data] = useState([])
	const [showError, setShowError] = useState(false)
	const [highlightedFamily, setHighlightedFamily] = useState()
	const [showingLegend, setShowingLegend] = useState(false)
	const [showingSurnames, setShowingSurnames] = useState(false)
	const [highlights, setHighlights] = useState({
		node: null,
		family: [],
		links: [],
	})
	const isMobile = window.innerWidth < 769
	const [theme, setTheme] = useState('dark')
	const [nameFormat, setNameFormat] = useState('firstLast') // 'firstLast' or 'lastFirst'

	// Detect device color scheme on mount
	useEffect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		if (mq.matches) {
			setTheme('dark')
		} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
			setTheme('light')
		} else {
			setTheme('dark')
		}
	}, [])

	// Set data-theme attribute on body
	useEffect(() => {
		document.body.setAttribute('data-theme', theme)
	}, [theme])

	const toggleTheme = () => {
		setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
	}

	// Clear highlights
	const clearHighlights = () => {
		setHighlights({ node: null, family: [], links: [] })
		setHighlightedFamily(null)
		setShowingLegend(false)
		setShowingSurnames(false)
	}

	const readFile = (file) => {
		setD3Data(d3ize(parse(file))) // Parse data
		setShowingRoots(true)
		setShowError(false)
	}

	const closeRoots = () => {
		clearHighlights()
		setShowingRoots(false)
		setD3Data([])
	}

	const handleUpload = (event) => {
		const file = event.target.files[0]
		const parts = file.name.split('.')
		const reader = new FileReader()

		if (parts[parts.length - 1].toLowerCase() === 'ged') {
			reader.onloadend = () => {
				readFile(reader.result)
			}
			reader.readAsText(file)
		} else {
			reader.readAsText(file)
			setShowError(true)
		}
	}

	return (
		<>
			<ThemeToggle theme={theme} toggleTheme={toggleTheme} />
			{!showingRoots ? (
				<Load
					handleUpload={handleUpload}
					loadHalfling={() => readFile(halflingFile)}
					loadKennedy={() => readFile(kennedyFile)}
					loadShakespeare={() => readFile(shakespeareFile)}
					loadTudor={() => readFile(tudorFile)}
					loadPlunkett={() => readFile(plunkettFile)}
					loadKardashian={() => readFile(kardashianFile)}
					loadBach={() => readFile(bachFile)}
					loadPotter={() => readFile(potterFile)}
					loadRoyal={() => readFile(royalFile)}
					loadTolkien={() => readFile(tolkienFile)}
					loadWashington={() => readFile(washingtonFile)}
					loadGreekGods={() => readFile(grekGodsFile)}
					loadRomanGods={() => readFile(romanGodsFile)}
					showError={showError}
				/>
			) : (
				<>
					<Controls
						d3Data={d3Data}
						closeRoots={closeRoots}
						highlights={highlights}
						highlightedFamily={highlightedFamily}
						setHighlightedFamily={setHighlightedFamily}
						showingLegend={showingLegend}
						setShowingLegend={setShowingLegend}
						showingSurnames={showingSurnames}
						setShowingSurnames={setShowingSurnames}
						isMobile={isMobile}
						clearHighlights={clearHighlights}
						theme={theme}
						toggleTheme={toggleTheme}
						nameFormat={nameFormat}
						setNameFormat={setNameFormat}
					/>
					<Graph
						d3Data={d3Data}
						highlights={highlights}
						setHighlights={setHighlights}
						highlightedFamily={highlightedFamily}
						setHighlightedFamily={setHighlightedFamily}
						showingLegend={showingLegend}
						setShowingLegend={setShowingLegend}
						showingSurnames={showingSurnames}
						setShowingSurnames={setShowingSurnames}
						isMobile={isMobile}
						clearHighlights={clearHighlights}
						theme={theme}
						nameFormat={nameFormat}
					/>
				</>
			)}
		</>
	)
}

ReactDOM.render(<App />, document.getElementById('root'))

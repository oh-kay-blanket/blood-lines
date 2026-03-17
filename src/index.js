// Modules
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { parse, d3ize } from 'gedcom-d3'

// Components
import Load from './Load'
import Controls from './Controls'
import Graph from './Graph'
import EditPanel from './EditPanel'

// Export utilities
import { downloadGedcom, downloadGedz, importGedz } from './gedcomExport'

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

// Generate a unique ID for new nodes
let nodeCounter = 0
function generateNodeId() {
	nodeCounter++
	return `INEW${Date.now()}${nodeCounter}`
}

// Rebuild surnameList from nodes
function rebuildSurnameList(nodes) {
	const surnameMap = {}
	// Collect a color palette from existing nodes
	const existingColors = {}
	nodes.forEach((node) => {
		if (node.surname && node.color) {
			existingColors[node.surname] = node.color
		}
	})

	nodes.forEach((node) => {
		const surname = node.surname || ''
		if (!surnameMap[surname]) {
			surnameMap[surname] = { surname, count: 0, color: existingColors[surname] || '#ccc' }
		}
		surnameMap[surname].count++
	})

	return Object.values(surnameMap)
}

const App = () => {
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
	const [nameFormat, setNameFormat] = useState('firstLast')

	// Edit mode state
	const [editMode, setEditMode] = useState(false)
	const [editingNode, setEditingNode] = useState(null)
	const [photoStore, setPhotoStore] = useState({})

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
		setD3Data(d3ize(parse(file)))
		setShowingRoots(true)
		setShowError(false)
		setPhotoStore({})
		setEditMode(false)
		setEditingNode(null)
	}

	const closeRoots = () => {
		clearHighlights()
		setShowingRoots(false)
		setD3Data([])
		setEditMode(false)
		setEditingNode(null)
		setPhotoStore({})
	}

	const handleUpload = async (event) => {
		const file = event.target.files[0]
		const parts = file.name.split('.')
		const ext = parts[parts.length - 1].toLowerCase()

		if (ext === 'ged') {
			const reader = new FileReader()
			reader.onloadend = () => {
				readFile(reader.result)
			}
			reader.readAsText(file)
		} else if (ext === 'gedz') {
			try {
				const { gedcomText, photos } = await importGedz(file)
				if (gedcomText) {
					setD3Data(d3ize(parse(gedcomText)))
					setPhotoStore(photos || {})
					setShowingRoots(true)
					setShowError(false)
				} else {
					setShowError(true)
				}
			} catch (e) {
				console.error('Error importing .gedz:', e)
				setShowError(true)
			}
		} else {
			setShowError(true)
		}
	}

	// --- Data mutation functions ---

	const updateNode = (nodeId, updates) => {
		const newNodes = d3Data.nodes.map((node) => {
			if (node.id === nodeId) {
				const updated = { ...node, ...updates }
				// Recalculate derived fields
				if (updates.firstName || updates.surname) {
					updated.name = `${updated.firstName || ''} ${updated.surname || ''}`.trim()
				}
				if (updates.yob !== undefined) {
					updated.fy = updated.yob ? -updated.yob : null
				}
				return updated
			}
			return node
		})
		const newSurnameList = rebuildSurnameList(newNodes)
		setD3Data({ ...d3Data, nodes: newNodes, surnameList: newSurnameList })
		// Update the highlights node if it's the one being edited
		if (highlights.node && highlights.node.id === nodeId) {
			const updatedNode = newNodes.find((n) => n.id === nodeId)
			setHighlights({ ...highlights, node: updatedNode })
		}
	}

	const addNode = (nodeData) => {
		const id = generateNodeId()
		const newNode = {
			id,
			name: `${nodeData.firstName || ''} ${nodeData.surname || ''}`.trim() || 'New Person',
			firstName: nodeData.firstName || '',
			surname: nodeData.surname || '',
			gender: nodeData.gender || 'M',
			yob: nodeData.yob || '',
			yod: nodeData.yod || '',
			dob: nodeData.dob || '',
			dod: nodeData.dod || '',
			pob: nodeData.pob || '',
			pod: nodeData.pod || '',
			bio: nodeData.bio || '',
			title: nodeData.title || '',
			color: '#ccc',
			fy: nodeData.yob ? -nodeData.yob : 0,
			families: [],
		}

		// Try to match color from existing nodes with same surname
		if (newNode.surname) {
			const match = d3Data.nodes.find((n) => n.surname === newNode.surname)
			if (match) newNode.color = match.color
		}

		const newNodes = [...d3Data.nodes, newNode]
		const newSurnameList = rebuildSurnameList(newNodes)
		setD3Data({ ...d3Data, nodes: newNodes, surnameList: newSurnameList })
		return id
	}

	const removeNode = (nodeId) => {
		const newNodes = d3Data.nodes.filter((n) => n.id !== nodeId)
		const newLinks = d3Data.links.filter((link) => {
			const srcId = typeof link.source === 'object' ? link.source.id : link.source
			const tgtId = typeof link.target === 'object' ? link.target.id : link.target
			return srcId !== nodeId && tgtId !== nodeId
		})
		// Reindex links
		newLinks.forEach((link, i) => { link.index = i })
		const newSurnameList = rebuildSurnameList(newNodes)
		setD3Data({ ...d3Data, nodes: newNodes, links: newLinks, surnameList: newSurnameList })
		// Remove photo
		if (photoStore[nodeId]) {
			const newPhotos = { ...photoStore }
			delete newPhotos[nodeId]
			setPhotoStore(newPhotos)
		}
		clearHighlights()
		setEditingNode(null)
	}

	const addLink = (sourceId, targetId, sourceType, targetType) => {
		// Check if link already exists
		const exists = d3Data.links.some((link) => {
			const srcId = typeof link.source === 'object' ? link.source.id : link.source
			const tgtId = typeof link.target === 'object' ? link.target.id : link.target
			return srcId === sourceId && tgtId === targetId
		})
		if (exists) return

		const newLink = {
			source: sourceId,
			target: targetId,
			sourceType,
			targetType,
			index: d3Data.links.length,
		}
		setD3Data({ ...d3Data, links: [...d3Data.links, newLink] })
	}

	const removeLink = (linkIndex) => {
		const newLinks = d3Data.links.filter((link) => link.index !== linkIndex)
		newLinks.forEach((link, i) => { link.index = i })
		setD3Data({ ...d3Data, links: newLinks })
	}

	const setNodePhoto = (nodeId, dataUrl) => {
		setPhotoStore({ ...photoStore, [nodeId]: dataUrl })
	}

	const removeNodePhoto = (nodeId) => {
		const newPhotos = { ...photoStore }
		delete newPhotos[nodeId]
		setPhotoStore(newPhotos)
	}

	const handleExportGed = () => {
		downloadGedcom(d3Data, photoStore)
	}

	const handleExportGedz = () => {
		downloadGedz(d3Data, photoStore)
	}

	const openEditPanel = (node) => {
		setEditingNode(node)
	}

	const closeEditPanel = () => {
		setEditingNode(null)
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
						editMode={editMode}
						setEditMode={setEditMode}
						openEditPanel={openEditPanel}
						photoStore={photoStore}
						handleExportGed={handleExportGed}
						handleExportGedz={handleExportGedz}
						addNode={addNode}
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
						editMode={editMode}
					/>
					{editingNode && editMode && (
						<EditPanel
							node={editingNode}
							d3Data={d3Data}
							updateNode={updateNode}
							removeNode={removeNode}
							addNode={addNode}
							addLink={addLink}
							removeLink={removeLink}
							photoStore={photoStore}
							setNodePhoto={setNodePhoto}
							removeNodePhoto={removeNodePhoto}
							onClose={closeEditPanel}
							isMobile={isMobile}
						/>
					)}
				</>
			)}
		</>
	)
}

ReactDOM.render(<App />, document.getElementById('root'))

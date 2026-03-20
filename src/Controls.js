import React, { useState, useEffect, useRef } from 'react'


const Controls = ({
	d3Data,
	closeRoots,
	highlights,
	highlightedFamily,
	setHighlightedFamily,
	showingSurnames,
	setShowingSurnames,
	isMobile,
	theme,
	toggleTheme,
	nameFormat,
	setNameFormat,
	editMode,
	setEditMode,
	openEditPanel,
	photoStore,
	handleExportGed,
	handleExportGedz,
	addNode,
	setHighlights,
	controlsVisible,
	graphRef,
	buildNodeHighlights,
	updateFamilyColor,
	colorList,
}) => {
	const [isNodeInfoVisible, setIsNodeInfoVisible] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchOpen, setSearchOpen] = useState(false)
	const [nodeInfoData, setNodeInfoData] = useState(null)
	const [showSettings, setShowSettings] = useState(false)
	const [colorPickerSurname, setColorPickerSurname] = useState(null)
	const settingsRef = useRef(null)
	const surnamesRef = useRef(null)
	const searchInputRef = useRef(null)

	useEffect(() => {
		if (highlights.node) {
			setNodeInfoData(highlights.node)
			setIsNodeInfoVisible(true)
		} else if (nodeInfoData) {
			setIsNodeInfoVisible(false)
			const timer = setTimeout(() => {
				setNodeInfoData(null)
			}, 300)
			return () => clearTimeout(timer)
		}
	}, [highlights.node])


	const toggleSurnames = () => {
		setShowingSurnames((prevState) => !prevState)
	}

	// Search results (computed inline, no graph re-render)
	const searchResults = searchQuery.length > 0
		? d3Data.nodes.filter((n) => {
			const q = searchQuery.toLowerCase()
			return (
				(n.name && n.name.toLowerCase().includes(q)) ||
				(n.firstName && n.firstName.toLowerCase().includes(q)) ||
				(n.surname && n.surname.toLowerCase().includes(q))
			)
		}).slice(0, 8)
		: []

	const handleSearchSelect = (node) => {
		setSearchQuery('')
		setSearchOpen(false)
		buildNodeHighlights(node)
		// Zoom camera to the selected node
		if (graphRef && graphRef.current) {
			const x = node.x || 0
			const y = node.y ?? node.fy ?? 0
			const z = node.z || 0
			graphRef.current.cameraPosition(
				{ x, y, z: z + 400 },
				{ x, y, z },
				1000,
			)
		}
	}

	const toggleSearch = () => {
		if (searchOpen) {
			setSearchQuery('')
			setSearchOpen(false)
		} else {
			setSearchOpen(true)
			setShowSettings(false)
			setTimeout(() => searchInputRef.current?.focus(), 300)
		}
	}

	function compareSurname(a, b) {
		if (a.surname < b.surname) return -1
		if (a.surname > b.surname) return 1
		return 0
	}

	function compareCount(a, b) {
		if (a.count < b.count) return 1
		if (a.count > b.count) return -1
		return 0
	}

	const surnameList = d3Data.surnameList
		.filter((name) => name.surname !== '')
		.sort(compareSurname)
		.sort(compareCount)
		.map((family, index) => (
			<div key={index} style={{ position: 'relative', display: 'inline-block' }}>
				<p
					style={{
						color: '#000',
						cursor: 'pointer',
						backgroundColor: !highlightedFamily
							? family.color
							: highlightedFamily === family.surname
							? family.color
							: '#ccc',
						border: '1px solid #000',
						padding: '.15rem 0.4rem',
						borderRadius: '0.4rem',
						margin: '0.15rem',
						boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
						fontFamily: "'Josefin Sans', sans-serif",
						fontSize: '0.9rem',
						width: 'fit-content',
						display: 'flex',
						alignItems: 'center',
						gap: '0.35rem',
					}}
					onClick={() =>
						highlightedFamily === family.surname
							? setHighlightedFamily()
							: setHighlightedFamily(family.surname)
					}
				>
					<span
						onClick={(e) => {
							e.stopPropagation()
							setColorPickerSurname(colorPickerSurname === family.surname ? null : family.surname)
						}}
						style={{
							display: 'inline-block',
							width: '14px',
							height: '14px',
							borderRadius: '50%',
							border: '1.5px solid rgba(0,0,0,0.4)',
							background: family.color,
							cursor: 'pointer',
							flexShrink: 0,
						}}
					/>
					{family.surname} ({family.count})
				</p>
				{colorPickerSurname === family.surname && (
					<div
						style={{
							position: 'absolute',
							top: '100%',
							left: 0,
							zIndex: 20,
							background: 'var(--grey-dark)',
							border: '1.5px solid var(--grey-light-soft)',
							borderRadius: '0.5rem',
							padding: '0.4rem',
							display: 'flex',
							flexWrap: 'wrap',
							gap: '4px',
							width: '180px',
							boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
						}}
						onClick={(e) => e.stopPropagation()}
					>
						{colorList.map((c) => (
							<span
								key={c}
								onClick={() => {
									updateFamilyColor(family.surname, c)
									setColorPickerSurname(null)
								}}
								style={{
									display: 'inline-block',
									width: '22px',
									height: '22px',
									borderRadius: '4px',
									background: c,
									cursor: 'pointer',
									border: c === family.color ? '2px solid var(--text)' : '1px solid rgba(0,0,0,0.2)',
									boxSizing: 'border-box',
								}}
							/>
						))}
					</div>
				)}
			</div>
		))

	const nodeInfoInsert = (node) => {
		const labelGender = node.gender === 'M' ? '♂' : node.gender === 'F' ? '♀' : ''
		const photo = photoStore && photoStore[node.id]

		return (
			<div id='node-info--content'>
					<button
					className='node-info-edit-icon'
					onClick={() => openEditPanel(node)}
					aria-label='Edit person'
				>
					<span className='material-icons-outlined'>edit</span>
				</button>
				{photo && (
					<div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
						<img
							src={photo}
							alt={node.name}
							style={{
								width: '80px',
								height: '80px',
								borderRadius: '50%',
								objectFit: 'cover',
								border: '2px solid rgba(255,255,255,0.3)',
							}}
						/>
					</div>
				)}
				{node.title ? (
					<h4 className='node-title'>
						<span>
							{node.name} ({node.title})
						</span>{' '}
						{labelGender}
					</h4>
				) : (
					<h4>
						<span>{node.name}</span> {labelGender}
					</h4>
				)}
				<p>
					<b>
						{node.yob} - {node.yod}
					</b>
				</p>
				{node.pob != '' && (
					<p>
						<b>From:</b> {node.pob}
					</p>
				)}
				{node.pod != '' && (
					<p>
						<b>Died:</b> {node.pod}
					</p>
				)}
				{node.bio && <p>{node.bio}</p>}
			</div>
		)
	}

	const handleAddNewPerson = () => {
		const newNode = addNode({
			firstName: 'New',
			surname: 'Person',
			gender: 'M',
		})
		setShowSettings(false)
		setHighlights({ node: newNode, family: [newNode], links: [] })
		openEditPanel(newNode)
	}

	const settingsRowStyle = {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '0.5rem 0',
	}

	const settingsLabelStyle = {
		color: 'var(--text)',
		fontSize: '0.9rem',
		margin: 0,
	}

	const pillBtnStyle = (active) => ({
		background: active ? 'var(--text)' : 'transparent',
		color: active ? 'var(--grey-dark)' : 'var(--text)',
		border: '1px solid var(--grey-light-soft)',
		borderRadius: '0.5rem',
		padding: '0.25rem 0.5rem',
		cursor: 'pointer',
		fontSize: '0.85rem',
	})

	return (
		<div id='controls' className={controlsVisible ? 'controls-visible' : 'controls-hidden'}>
			<div
				id='back-button'
				onClick={closeRoots}
				style={{
					background: 'var(--grey-dark)',
					color: 'var(--text)',
					border: '1.5px solid var(--grey-light-soft)',
					borderRadius: '50px',
					padding: '8px',
					margin: '1rem',
					width: '1rem',
					height: '1rem',
					textAlign: 'center',
					fontSize: '.8rem',
					cursor: 'pointer',
					boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
				}}
			>
				<span className='material-icons-outlined'>close</span>
			</div>

			{showSettings && (
				<div className='menu-overlay' onClick={() => setShowSettings(false)} />
			)}
			{showingSurnames && (
				<div className='menu-overlay' onClick={() => { setShowingSurnames(false); setColorPickerSurname(null) }} />
			)}
			{searchOpen && (
				<div className='menu-overlay' onClick={() => { setSearchOpen(false); setSearchQuery('') }} />
			)}

			{/* Search button + expanding bar */}
			<div id='search' className={searchOpen ? 'open' : ''}>
				<button
					id='search-button'
					onClick={toggleSearch}
					aria-label='Search'
				>
					<span className='material-icons-outlined'>search</span>
				</button>
				<div className='search-input-wrapper'>
					<input
						ref={searchInputRef}
						type='text'
						placeholder='search...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						tabIndex={searchOpen ? 0 : -1}
					/>
					{searchQuery && (
						<span
							className='material-icons-outlined search-clear'
							onClick={() => setSearchQuery('')}
						>
							close
						</span>
					)}
				</div>
				{searchOpen && searchQuery.trim() && (
					<div className='search-results'>
						{searchResults.length === 0 ? (
							<p className='search-no-results'>no matches</p>
						) : (
							searchResults.map((person) => (
								<div
									key={person.id}
									className='search-result-item'
									onClick={() => handleSearchSelect(person)}
								>
									<span
										className='search-result-dot'
										style={{ background: person.color }}
									/>
									<span className='search-result-name'>
										{person.name} {person.yob ? `(${person.yob})` : ''}
									</span>
								</div>
							))
						)}
					</div>
				)}
			</div>

			{/* Settings gear button + dropdown */}
			<div id='settings' ref={settingsRef}>
				<button
					id='settings-button'
					className={showSettings ? 'active' : ''}
					onClick={() => setShowSettings((prev) => !prev)}
					aria-label='Settings'
				>
					<i className='fa fa-cog' aria-hidden='true'></i>
				</button>

				{showSettings && (
					<div id='settings-dropdown'>
						{/* Theme */}
						<div style={settingsRowStyle}>
							<p style={settingsLabelStyle}>Theme</p>
							<button
								className='theme-toggle-slider'
								onClick={toggleTheme}
								aria-label='Toggle color mode'
							>
								<span
									className={theme === 'dark' ? 'active' : ''}
									aria-label='Dark'
								>
									<span className='material-icons-outlined'>dark_mode</span>
								</span>
								<span
									className={theme === 'light' ? 'active' : ''}
									aria-label='Light'
								>
									<span className='material-icons-outlined'>light_mode</span>
								</span>
								<span className='slider' style={{ left: theme === 'dark' ? 0 : 33 }}></span>
							</button>
						</div>

						<hr className='settings-divider' />

						{/* Name Format */}
						<div style={settingsRowStyle}>
							<p style={settingsLabelStyle}>Names</p>
							<div style={{ display: 'flex', gap: '0.4rem' }}>
								<button
									onClick={() => setNameFormat('firstLast')}
									style={pillBtnStyle(nameFormat === 'firstLast')}
								>
									First Last
								</button>
								<button
									onClick={() => setNameFormat('lastFirst')}
									style={pillBtnStyle(nameFormat === 'lastFirst')}
								>
									Last, First
								</button>
							</div>
						</div>

						<hr className='settings-divider' />

						{/* + Person */}
						<div style={settingsRowStyle}>
							<button
								onClick={handleAddNewPerson}
								style={{
									...pillBtnStyle(false),
									width: '100%',
									textAlign: 'center',
									padding: '0.4rem 0.5rem',
								}}
							>
								+ person
							</button>
						</div>

						<hr className='settings-divider' />

						{/* Export */}
						<div style={{ padding: '0.5rem 0' }}>
							<p style={{ ...settingsLabelStyle, marginBottom: '0.4rem' }}>Export</p>
							<div style={{ display: 'flex', gap: '0.4rem' }}>
								<button
									onClick={() => { handleExportGed(); setShowSettings(false) }}
									style={pillBtnStyle(false)}
								>
									.ged
								</button>
								<button
									onClick={() => { handleExportGedz(); setShowSettings(false) }}
									style={pillBtnStyle(false)}
								>
									.gedz
								</button>
							</div>
						</div>

						<hr className='settings-divider' />

						{/* Controls help */}
						<div style={{ padding: '0.5rem 0' }}>
							<p className='control-title' style={{ color: 'var(--text)' }}>
								controls
							</p>
							{isMobile ? (
								<>
									<p style={{ color: 'var(--text)' }}>tap on name: person info</p>
									<p style={{ color: 'var(--text)' }}>pinch: zoom</p>
									<p style={{ color: 'var(--text)' }}>swipe: rotate</p>
									<p style={{ color: 'var(--text)' }}>two-finger swipe: pan</p>
								</>
							) : (
								<>
									<p style={{ color: 'var(--text)' }}>click on name: person info</p>
									<p style={{ color: 'var(--text)' }}>scroll: zoom</p>
									<p style={{ color: 'var(--text)' }}>left-click drag: rotate</p>
									<p style={{ color: 'var(--text)' }}>right-click drag: pan</p>
								</>
							)}
						</div>

						<hr className='settings-divider' />

						{/* Legend */}
						<div style={{ padding: '0.5rem 0' }}>
							<p className='control-title' style={{ color: 'var(--text)' }}>
								legend
							</p>
							<div className='legend-line'>
								<span
									style={{
										display: 'inline-block',
										width: '20px',
										height: '0px',
										borderTop: `2px solid ${theme === 'light' ? 'rgba(220, 80, 80, 0.45)' : 'rgba(252, 103, 103, 0.7)'}`,
										marginRight: '4px',
										flexShrink: 0,
									}}
								/>
								<p style={{ color: 'var(--text)' }}>- blood line</p>
							</div>
							<div className='legend-line'>
								<span
									style={{
										display: 'inline-block',
										width: '20px',
										height: '0px',
										borderTop: `2px dashed ${theme === 'light' ? 'rgb(230, 180, 30)' : 'rgb(255, 200, 0)'}`,
										marginRight: '4px',
										flexShrink: 0,
									}}
								/>
								<p style={{ color: 'var(--text)' }}>- love line</p>
							</div>
						</div>
					</div>
				)}
			</div>

			<div id='node-info' className={isNodeInfoVisible ? 'visible' : ''}>
				{nodeInfoData && (
					<div
						style={{
							background: nodeInfoData.color,
							color: 'var(--text)',
							border: '1.5px solid var(--grey-light-soft)',
							borderRadius: '1rem',
							padding: '1rem',
							boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
						}}
					>
						{nodeInfoInsert(nodeInfoData)}
					</div>
				)}
			</div>

			<div id='surnames' ref={surnamesRef}>
				<button
					id='surnames-button'
					className={showingSurnames ? 'active' : ''}
					onClick={toggleSurnames}
					aria-label='Filter by surname'
				>
					<span className='material-icons-outlined'>filter_list</span>
				</button>
				{showingSurnames && (
					<div
						className='surnames-content'
						style={{
							background: 'var(--grey-dark)',
							color: 'var(--text)',
							border: '1.5px solid var(--grey-light-soft)',
						}}
					>
						{surnameList}
					</div>
				)}
			</div>
		</div>
	)
}

export default Controls

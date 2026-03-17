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
}) => {
	const [isNodeInfoVisible, setIsNodeInfoVisible] = useState(false)
	const [nodeInfoData, setNodeInfoData] = useState(null)
	const [showSettings, setShowSettings] = useState(false)
	const settingsRef = useRef(null)

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

	// Close settings dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (settingsRef.current && !settingsRef.current.contains(e.target)) {
				setShowSettings(false)
			}
		}
		if (showSettings) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [showSettings])

	const toggleSurnames = () => {
		setShowingSurnames((prevState) => !prevState)
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
			<p
				key={index}
				style={{
					color: '#000',
					cursor: 'pointer',
					backgroundColor: !highlightedFamily
						? family.color
						: highlightedFamily === family.surname
						? family.color
						: '#ccc',
					border: '1px solid #000',
					padding: '.25rem 0.5rem',
					borderRadius: '0.5rem',
					margin: '0.25rem',
					boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
					fontFamily: 'Helvetica, Arial, sans-serif',
					width: 'fit-content',
				}}
				onClick={(e) =>
					highlightedFamily === family.surname
						? setHighlightedFamily()
						: setHighlightedFamily(family.surname)
				}
			>
				{family.surname} ({family.count})
			</p>
		))

	const nodeInfoInsert = (node) => {
		const labelGender = node.gender === 'M' ? `♂` : `♀`
		const photo = photoStore && photoStore[node.id]

		return (
			<div id='node-info--content'>
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
				{editMode && (
					<button
						onClick={() => openEditPanel(node)}
						style={{
							marginTop: '0.5rem',
							padding: '0.4rem 0.8rem',
							borderRadius: '0.5rem',
							border: '1px solid rgba(0,0,0,0.3)',
							background: 'rgba(255,255,255,0.2)',
							color: '#000',
							cursor: 'pointer',
							fontSize: '0.85rem',
							width: '100%',
						}}
					>
						Edit Person
					</button>
				)}
			</div>
		)
	}

	const handleAddNewPerson = () => {
		const newId = addNode({
			firstName: 'New',
			surname: 'Person',
			gender: 'M',
		})
		setShowSettings(false)
		// Find the new node and open the edit panel
		setTimeout(() => {
			const newNode = d3Data.nodes.find((n) => n.id === newId)
			if (newNode) openEditPanel(newNode)
		}, 100)
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
		<div id='controls'>
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
				<i className='fa fa-times' aria-hidden='true'></i>
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

						{/* Edit Mode */}
						<div style={settingsRowStyle}>
							<p style={settingsLabelStyle}>Edit mode</p>
							<button
								onClick={() => setEditMode(!editMode)}
								style={{
									...pillBtnStyle(editMode),
									background: editMode ? 'var(--root)' : 'transparent',
									color: editMode ? '#fff' : 'var(--text)',
									fontWeight: editMode ? 'bold' : 'normal',
								}}
							>
								{editMode ? 'on' : 'off'}
							</button>
						</div>

						{/* + Person (only in edit mode) */}
						{editMode && (
							<div style={{ ...settingsRowStyle, paddingTop: 0 }}>
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
						)}

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

			<div id='surnames'>
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
				<p
					id='surnames-button'
					className={showingSurnames ? 'active' : ''}
					onClick={toggleSurnames}
					style={{
						background: 'var(--grey-dark)',
						color: 'var(--text)',
						border: '1.5px solid var(--grey-light-soft)',
						borderRadius: '1.2rem',
						padding: '0.5rem 1.2rem',
						margin: '0.5rem 0',
						cursor: 'pointer',
						boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
					}}
				>
					{'names'}
				</p>
			</div>
		</div>
	)
}

export default Controls

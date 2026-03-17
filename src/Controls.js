import React, { useState, useEffect } from 'react'

import greyLine from './img/grey-line.png'
import goldLine from './img/gold-line.png'

const Controls = ({
	d3Data,
	closeRoots,
	highlights,
	highlightedFamily,
	setHighlightedFamily,
	showingLegend,
	setShowingLegend,
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
	const [showExportMenu, setShowExportMenu] = useState(false)

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

	const toggleLegend = () => {
		setShowingLegend((prevState) => !prevState)
		setShowingSurnames(false)
	}

	const toggleSurnames = () => {
		setShowingSurnames((prevState) => !prevState)
		setShowingLegend(false)
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

	const controlBtnStyle = {
		background: 'var(--grey-dark)',
		color: 'var(--text)',
		border: '1.5px solid var(--grey-light-soft)',
		borderRadius: '50%',
		padding: '0.5rem',
		margin: '0.5rem 0',
		width: '1.5rem',
		height: '1.5rem',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
		fontSize: '1rem',
	}

	const handleAddNewPerson = () => {
		const newId = addNode({
			firstName: 'New',
			surname: 'Person',
			gender: 'M',
		})
		// Find the new node and open the edit panel
		setTimeout(() => {
			const newNode = d3Data.nodes.find((n) => n.id === newId)
			if (newNode) openEditPanel(newNode)
		}, 100)
	}

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

			<div id='legend'>
				{showingLegend && (
					<div
						id='legend-content'
						style={{
							background: 'var(--grey-dark)',
							border: '1.5px solid var(--grey-light-soft)',
							color: 'var(--text)',
							boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
						}}
					>
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
								<p style={{ color: 'var(--text)' }}>
									click on name: person info
								</p>
								<p style={{ color: 'var(--text)' }}>scroll: zoom</p>
								<p style={{ color: 'var(--text)' }}>left-click drag: rotate</p>
								<p style={{ color: 'var(--text)' }}>right-click drag: pan</p>
							</>
						)}

						<br />

						<p className='control-title' style={{ color: 'var(--text)' }}>
							settings
						</p>
						<div style={{ marginBottom: '0.5rem' }}>
							<p style={{ color: 'var(--text)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
								Name format:
							</p>
							<div style={{ display: 'flex', gap: '0.5rem' }}>
								<button
									onClick={() => setNameFormat('firstLast')}
									style={{
										background: nameFormat === 'firstLast' ? 'var(--text)' : 'transparent',
										color: nameFormat === 'firstLast' ? 'var(--grey-dark)' : 'var(--text)',
										border: '1px solid var(--grey-light-soft)',
										borderRadius: '0.5rem',
										padding: '0.25rem 0.5rem',
										cursor: 'pointer',
										fontSize: '0.85rem',
									}}
								>
									First Last
								</button>
								<button
									onClick={() => setNameFormat('lastFirst')}
									style={{
										background: nameFormat === 'lastFirst' ? 'var(--text)' : 'transparent',
										color: nameFormat === 'lastFirst' ? 'var(--grey-dark)' : 'var(--text)',
										border: '1px solid var(--grey-light-soft)',
										borderRadius: '0.5rem',
										padding: '0.25rem 0.5rem',
										cursor: 'pointer',
										fontSize: '0.85rem',
									}}
								>
									Last, First
								</button>
							</div>
						</div>

						<br />

						<p className='control-title' style={{ color: 'var(--text)' }}>
							legend
						</p>
						<div className='legend-line'>
							<img src={greyLine} />
							<p style={{ color: 'var(--text)' }}>- blood line</p>
						</div>
						<div className='legend-line'>
							<img src={goldLine} />
							<p style={{ color: 'var(--text)' }}>- love line</p>
						</div>
					</div>
				)}
				<p
					id='legend-button'
					className={showingLegend ? 'active' : ''}
					onClick={toggleLegend}
					style={{
						...controlBtnStyle,
						fontStyle: 'italic',
						fontWeight: 'bold',
					}}
				>
					i
				</p>
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

			{/* Edit Mode & Export Controls */}
			<div id='edit-controls' style={{
				position: 'fixed',
				bottom: '1rem',
				left: '1rem',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
				zIndex: 100,
			}}>
				{/* Edit Mode Toggle */}
				<button
					onClick={() => setEditMode(!editMode)}
					style={{
						...controlBtnStyle,
						borderRadius: '1.2rem',
						padding: '0.5rem 1rem',
						width: 'auto',
						background: editMode ? 'var(--root)' : 'var(--grey-dark)',
						color: editMode ? '#fff' : 'var(--text)',
						fontWeight: editMode ? 'bold' : 'normal',
					}}
				>
					{editMode ? 'editing' : 'edit'}
				</button>

				{/* Add Person (only in edit mode) */}
				{editMode && (
					<button
						onClick={handleAddNewPerson}
						style={{
							...controlBtnStyle,
							borderRadius: '1.2rem',
							padding: '0.5rem 1rem',
							width: 'auto',
							fontSize: '0.85rem',
						}}
					>
						+ person
					</button>
				)}

				{/* Export */}
				<div style={{ position: 'relative' }}>
					<button
						onClick={() => setShowExportMenu(!showExportMenu)}
						style={{
							...controlBtnStyle,
							borderRadius: '1.2rem',
							padding: '0.5rem 1rem',
							width: 'auto',
						}}
					>
						export
					</button>
					{showExportMenu && (
						<div style={{
							position: 'absolute',
							bottom: '100%',
							left: 0,
							marginBottom: '0.5rem',
							background: 'var(--grey-dark)',
							border: '1.5px solid var(--grey-light-soft)',
							borderRadius: '0.5rem',
							overflow: 'hidden',
							boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
							minWidth: '140px',
						}}>
							<button
								onClick={() => { handleExportGed(); setShowExportMenu(false) }}
								style={{
									display: 'block',
									width: '100%',
									padding: '0.6rem 1rem',
									background: 'none',
									border: 'none',
									borderBottom: '1px solid var(--grey-light-soft)',
									color: 'var(--text)',
									cursor: 'pointer',
									textAlign: 'left',
									fontSize: '0.85rem',
								}}
							>
								.ged (no photos)
							</button>
							<button
								onClick={() => { handleExportGedz(); setShowExportMenu(false) }}
								style={{
									display: 'block',
									width: '100%',
									padding: '0.6rem 1rem',
									background: 'none',
									border: 'none',
									color: 'var(--text)',
									cursor: 'pointer',
									textAlign: 'left',
									fontSize: '0.85rem',
								}}
							>
								.gedz (with photos)
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default Controls

import React, { useState } from 'react'

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
}) => {
	const toggleLegend = () => {
		setShowingLegend((prevState) => !prevState)
		setShowingSurnames(false)
	}

	const toggleSurnames = () => {
		setShowingSurnames((prevState) => !prevState)
		setShowingLegend(false)
	}

	function compareSurname(a, b) {
		if (a.surname < b.surname) {
			return -1
		}
		if (a.surname > b.surname) {
			return 1
		}
		return 0
	}

	function compareCount(a, b) {
		if (a.count < b.count) {
			return 1
		}
		if (a.count > b.count) {
			return -1
		}
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
		// Gender
		const labelGender = node.gender === 'M' ? `♂` : `♀`

		return (
			<div id='node-info--content'>
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
					{'info'}
				</p>
			</div>

			<div id='node-info'>
				{!!highlights.node && (
					<div
						style={{
							background: highlights.node.color,
							color: 'var(--text)',
							border: '1.5px solid var(--grey-light-soft)',
							borderRadius: '1rem',
							padding: '1rem',
							boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
						}}
					>
						{nodeInfoInsert(highlights.node)}
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

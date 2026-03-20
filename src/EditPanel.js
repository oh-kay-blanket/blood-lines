import React, { useState, useEffect, useRef } from 'react'

const EditPanel = ({
	node,
	d3Data,
	updateNode,
	removeNode,
	addNode,
	addLink,
	removeLink,
	photoStore,
	setNodePhoto,
	removeNodePhoto,
	onClose,
	openEditPanel,
	isMobile,
	updateFamilyColor,
	colorList,
}) => {
	const [form, setForm] = useState({})
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const [addingRelation, setAddingRelation] = useState(null) // 'parent' | 'spouse' | 'child' | null
	const [searchQuery, setSearchQuery] = useState('')
	const [showNewPersonForm, setShowNewPersonForm] = useState(false)
	const [newPerson, setNewPerson] = useState({ firstName: '', surname: '', gender: 'U', yob: '' })
	const [showColorPicker, setShowColorPicker] = useState(false)
	const fileInputRef = useRef(null)

	useEffect(() => {
		setForm({
			firstName: node.firstName || '',
			surname: node.surname || '',
			gender: node.gender || 'U',
			yob: node.yob || '',
			yod: node.yod || '',
			dob: node.dob || '',
			dod: node.dod || '',
			pob: node.pob || '',
			pod: node.pod || '',
			title: node.title || '',
			bio: node.bio || '',
		})
		setShowDeleteConfirm(false)
		setAddingRelation(null)
		setSearchQuery('')
		setShowNewPersonForm(false)
		setShowColorPicker(false)
	}, [node.id])

	const handleChange = (field, value) => {
		setForm({ ...form, [field]: value })
	}

	const handleSave = () => {
		const updates = { ...form }
		// Parse numeric year fields
		if (updates.yob !== '') updates.yob = Number(updates.yob) || ''
		if (updates.yod !== '') updates.yod = Number(updates.yod) || ''
		updateNode(node.id, updates)
		onClose()
	}

	const handlePhotoUpload = (e) => {
		const file = e.target.files[0]
		if (!file) return

		// Validate type
		const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
		if (!validTypes.includes(file.type)) {
			alert('Please upload a JPG, PNG, GIF, or WebP image.')
			return
		}

		// Validate size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			alert('Photo must be under 5MB.')
			return
		}

		const reader = new FileReader()
		reader.onload = () => {
			setNodePhoto(node.id, reader.result)
		}
		reader.readAsDataURL(file)
	}

	// Get relationships for this node
	const getRelationships = () => {
		const parents = []
		const spouses = []
		const children = []

		d3Data.links.forEach((link) => {
			const srcId = typeof link.source === 'object' ? link.source.id : link.source
			const tgtId = typeof link.target === 'object' ? link.target.id : link.target

			// This node is the child
			if (tgtId === node.id && link.targetType === 'CHIL') {
				const parent = d3Data.nodes.find((n) => n.id === srcId)
				if (parent) parents.push({ node: parent, linkIndex: link.index })
			}
			if (srcId === node.id && link.sourceType === 'CHIL') {
				const parent = d3Data.nodes.find((n) => n.id === tgtId)
				if (parent) parents.push({ node: parent, linkIndex: link.index })
			}

			// This node is a spouse
			if (srcId === node.id && (link.sourceType === 'HUSB' || link.sourceType === 'WIFE') &&
				(link.targetType === 'HUSB' || link.targetType === 'WIFE')) {
				const spouse = d3Data.nodes.find((n) => n.id === tgtId)
				if (spouse) spouses.push({ node: spouse, linkIndex: link.index })
			}
			if (tgtId === node.id && (link.sourceType === 'HUSB' || link.sourceType === 'WIFE') &&
				(link.targetType === 'HUSB' || link.targetType === 'WIFE')) {
				const spouse = d3Data.nodes.find((n) => n.id === srcId)
				if (spouse) spouses.push({ node: spouse, linkIndex: link.index })
			}

			// This node is the parent
			if (srcId === node.id && (link.sourceType === 'HUSB' || link.sourceType === 'WIFE') &&
				link.targetType === 'CHIL') {
				const child = d3Data.nodes.find((n) => n.id === tgtId)
				if (child) children.push({ node: child, linkIndex: link.index })
			}
			if (tgtId === node.id && (link.targetType === 'HUSB' || link.targetType === 'WIFE') &&
				link.sourceType === 'CHIL') {
				const child = d3Data.nodes.find((n) => n.id === srcId)
				if (child) children.push({ node: child, linkIndex: link.index })
			}
		})

		// Deduplicate
		const seen = {}
		const dedup = (arr) => arr.filter((item) => {
			if (seen[item.node.id]) return false
			seen[item.node.id] = true
			return true
		})

		return {
			parents: dedup(parents),
			spouses: dedup(spouses),
			children: dedup(children),
		}
	}

	const relationships = getRelationships()

	// Search existing people for adding relationships
	const searchResults = searchQuery.length > 0
		? d3Data.nodes.filter((n) => {
			if (n.id === node.id) return false
			const name = (n.name || '').toLowerCase()
			return name.includes(searchQuery.toLowerCase())
		}).slice(0, 8)
		: []

	const handleAddExistingPerson = (personId) => {
		if (addingRelation === 'parent') {
			const parentNode = d3Data.nodes.find((n) => n.id === personId)
			const parentType = parentNode && parentNode.gender === 'F' ? 'WIFE' : 'HUSB'
			addLink(personId, node.id, parentType, 'CHIL')
		} else if (addingRelation === 'spouse') {
			const myType = node.gender === 'M' ? 'HUSB' : 'WIFE'
			const theirType = node.gender === 'M' ? 'WIFE' : 'HUSB'
			addLink(node.id, personId, myType, theirType)
		} else if (addingRelation === 'child') {
			const myType = node.gender === 'M' ? 'HUSB' : 'WIFE'
			addLink(node.id, personId, myType, 'CHIL')
		}
		setAddingRelation(null)
		setSearchQuery('')
	}

	const handleCreateAndLink = () => {
		// Save current person's changes first
		const updates = { ...form }
		if (updates.yob !== '') updates.yob = Number(updates.yob) || ''
		if (updates.yod !== '') updates.yod = Number(updates.yod) || ''
		updateNode(node.id, updates)

		const newNode = addNode({
			firstName: newPerson.firstName,
			surname: newPerson.surname || node.surname,
			gender: newPerson.gender,
			yob: newPerson.yob ? Number(newPerson.yob) : '',
		})

		if (addingRelation === 'parent') {
			const parentType = newPerson.gender === 'F' ? 'WIFE' : 'HUSB'
			addLink(newNode.id, node.id, parentType, 'CHIL')
		} else if (addingRelation === 'spouse') {
			const myType = node.gender === 'M' ? 'HUSB' : 'WIFE'
			const theirType = node.gender === 'M' ? 'WIFE' : 'HUSB'
			addLink(node.id, newNode.id, myType, theirType)
		} else if (addingRelation === 'child') {
			const myType = node.gender === 'M' ? 'HUSB' : 'WIFE'
			addLink(node.id, newNode.id, myType, 'CHIL')
		}

		setAddingRelation(null)
		setSearchQuery('')
		setShowNewPersonForm(false)
		setNewPerson({ firstName: '', surname: '', gender: 'U', yob: '' })
	}

	const panelStyle = {
		position: 'fixed',
		top: isMobile ? 0 : '1rem',
		right: isMobile ? 0 : '1rem',
		bottom: isMobile ? 0 : '1rem',
		width: isMobile ? '100%' : '380px',
		height: isMobile ? '100%' : 'auto',
		background: 'var(--grey-dark)',
		color: 'var(--text)',
		border: '1.5px solid var(--grey-light-soft)',
		borderRadius: isMobile ? 0 : '1rem',
		zIndex: 1000,
		overflowY: 'auto',
		boxShadow: '-4px 0 20px rgba(0,0,0,0.2)',
	}

	const inputStyle = {
		width: '100%',
		padding: '0.5rem',
		borderRadius: '0.5rem',
		border: '1px solid var(--grey-light-soft)',
		background: 'var(--grey-dark)',
		color: 'var(--text)',
		fontSize: '0.9rem',
		boxSizing: 'border-box',
	}

	const labelStyle = {
		fontSize: '0.8rem',
		marginBottom: '0.25rem',
		display: 'block',
		opacity: 0.7,
	}

	const fieldStyle = {
		marginBottom: '0.75rem',
	}

	const btnStyle = {
		padding: '0.4rem 0.8rem',
		borderRadius: '0.5rem',
		border: '1px solid var(--grey-light-soft)',
		background: 'var(--grey-dark)',
		color: 'var(--text)',
		cursor: 'pointer',
		fontSize: '0.85rem',
	}

	const btnPrimaryStyle = {
		...btnStyle,
		background: 'var(--root)',
		color: '#fff',
		border: '1px solid var(--root)',
	}

	const btnDangerStyle = {
		...btnStyle,
		background: '#c0392b',
		color: '#fff',
		border: '1px solid #c0392b',
	}

	const chipStyle = {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.4rem',
		padding: '0.3rem 0.6rem',
		borderRadius: '1rem',
		fontSize: '0.85rem',
		margin: '0.2rem',
		border: '1px solid var(--grey-light-soft)',
	}

	const sectionTitleStyle = {
		fontSize: '0.85rem',
		fontWeight: 'bold',
		marginTop: '1rem',
		marginBottom: '0.5rem',
		borderBottom: '1px solid var(--grey-light-soft)',
		paddingBottom: '0.25rem',
	}

	return (
		<div className='edit-panel' style={panelStyle}>
			<div style={{ padding: '1rem' }}>
				{/* Header */}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
					<h3 style={{ margin: 0 }}>Edit Person</h3>
					<button onClick={onClose} className='close-button' aria-label='Close'>
						<span className='material-icons-outlined'>close</span>
					</button>
				</div>

				{/* Photo */}
				<div style={{ textAlign: 'center', marginBottom: '1rem' }}>
					{photoStore[node.id] ? (
						<div>
							<img
								src={photoStore[node.id]}
								alt={node.name}
								style={{
									width: '120px',
									height: '120px',
									borderRadius: '50%',
									objectFit: 'cover',
									border: '3px solid var(--grey-light-soft)',
								}}
							/>
							<div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
								<button style={btnStyle} onClick={() => fileInputRef.current.click()}>
									Change Photo
								</button>
								<button style={btnDangerStyle} onClick={() => removeNodePhoto(node.id)}>
									Remove
								</button>
							</div>
						</div>
					) : (
						<div>
							<div style={{
								width: '120px',
								height: '120px',
								borderRadius: '50%',
								border: '2px dashed var(--grey-light-soft)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								margin: '0 auto',
								cursor: 'pointer',
								fontSize: '0.8rem',
								opacity: 0.6,
							}} onClick={() => fileInputRef.current.click()}>
								Add Photo
							</div>
						</div>
					)}
					<input
						ref={fileInputRef}
						type='file'
						accept='image/jpeg,image/png,image/gif,image/webp'
						onChange={handlePhotoUpload}
						style={{ display: 'none' }}
					/>
				</div>

				{/* Person Details */}
				<div style={fieldStyle}>
					<label style={labelStyle}>First Name</label>
					<input
						style={inputStyle}
						value={form.firstName || ''}
						onChange={(e) => handleChange('firstName', e.target.value)}
					/>
				</div>
				<div style={fieldStyle}>
					<label style={labelStyle}>Surname</label>
					<input
						style={inputStyle}
						value={form.surname || ''}
						onChange={(e) => handleChange('surname', e.target.value)}
					/>
				</div>
				{node.surname && colorList && (
					<div style={fieldStyle}>
						<label style={labelStyle}>Family Color</label>
						<div>
							<span
								onClick={() => setShowColorPicker(!showColorPicker)}
								style={{
									display: 'inline-block',
									width: '28px',
									height: '28px',
									borderRadius: '6px',
									background: node.color,
									border: '2px solid var(--grey-light-soft)',
									cursor: 'pointer',
									verticalAlign: 'middle',
								}}
							/>
							{showColorPicker && (
								<div
									style={{
										marginTop: '0.4rem',
										display: 'flex',
										flexWrap: 'wrap',
										gap: '4px',
									}}
								>
									{colorList.map((c) => (
										<span
											key={c}
											onClick={() => {
												updateFamilyColor(node.surname, c)
												setShowColorPicker(false)
											}}
											style={{
												display: 'inline-block',
												width: '24px',
												height: '24px',
												borderRadius: '4px',
												background: c,
												cursor: 'pointer',
												border: c === node.color ? '2px solid var(--text)' : '1px solid rgba(0,0,0,0.2)',
												boxSizing: 'border-box',
											}}
										/>
									))}
								</div>
							)}
						</div>
					</div>
				)}
				<div style={fieldStyle}>
					<label style={labelStyle}>Gender</label>
					<select
						style={inputStyle}
						value={form.gender || 'U'}
						onChange={(e) => handleChange('gender', e.target.value)}
					>
						<option value='U'>Unspecified</option>
						<option value='F'>Female</option>
						<option value='M'>Male</option>
					</select>
				</div>

				<div style={{ display: 'flex', gap: '0.5rem' }}>
					<div style={{ ...fieldStyle, flex: 1 }}>
						<label style={labelStyle}>Year of Birth</label>
						<input
							style={inputStyle}
							value={form.yob || ''}
							onChange={(e) => handleChange('yob', e.target.value)}
							placeholder='e.g. 1950'
						/>
					</div>
					<div style={{ ...fieldStyle, flex: 1 }}>
						<label style={labelStyle}>Year of Death</label>
						<input
							style={inputStyle}
							value={form.yod || ''}
							onChange={(e) => handleChange('yod', e.target.value)}
							placeholder='e.g. 2020'
						/>
					</div>
				</div>

				<div style={fieldStyle}>
					<label style={labelStyle}>Place of Birth</label>
					<input
						style={inputStyle}
						value={form.pob || ''}
						onChange={(e) => handleChange('pob', e.target.value)}
					/>
				</div>
				<div style={fieldStyle}>
					<label style={labelStyle}>Place of Death</label>
					<input
						style={inputStyle}
						value={form.pod || ''}
						onChange={(e) => handleChange('pod', e.target.value)}
					/>
				</div>
				<div style={fieldStyle}>
					<label style={labelStyle}>Title</label>
					<input
						style={inputStyle}
						value={form.title || ''}
						onChange={(e) => handleChange('title', e.target.value)}
					/>
				</div>
				<div style={fieldStyle}>
					<label style={labelStyle}>Bio</label>
					<textarea
						style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
						value={form.bio || ''}
						onChange={(e) => handleChange('bio', e.target.value)}
					/>
				</div>

				{/* Save button */}
				<button style={{ ...btnPrimaryStyle, width: '100%', marginBottom: '0.5rem' }} onClick={handleSave}>
					Save Changes
				</button>

				{/* Relationships */}
				<div style={sectionTitleStyle}>Parents</div>
				<div>
					{relationships.parents.map((rel) => (
						<span key={rel.node.id} style={{ ...chipStyle, background: rel.node.color }}>
							<span style={{ color: '#000' }}>{rel.node.name}</span>
							<button
								onClick={() => removeLink(rel.linkIndex)}
								style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', fontSize: '0.8rem', padding: 0 }}
							>
								x
							</button>
						</span>
					))}
						<button style={{ ...btnStyle, marginLeft: '0.5rem', fontSize: '0.8rem' }} onClick={() => { setAddingRelation('parent'); setShowNewPersonForm(false); setSearchQuery('') }}>
						+ Add
					</button>
				</div>

				<div style={sectionTitleStyle}>Spouses</div>
				<div>
					{relationships.spouses.map((rel) => (
						<span key={rel.node.id} style={{ ...chipStyle, background: rel.node.color }}>
							<span style={{ color: '#000' }}>{rel.node.name}</span>
							<button
								onClick={() => removeLink(rel.linkIndex)}
								style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', fontSize: '0.8rem', padding: 0 }}
							>
								x
							</button>
						</span>
					))}
						<button style={{ ...btnStyle, marginLeft: '0.5rem', fontSize: '0.8rem' }} onClick={() => { setAddingRelation('spouse'); setShowNewPersonForm(false); setSearchQuery('') }}>
						+ Add
					</button>
				</div>

				<div style={sectionTitleStyle}>Children</div>
				<div>
					{relationships.children.map((rel) => (
						<span key={rel.node.id} style={{ ...chipStyle, background: rel.node.color }}>
							<span style={{ color: '#000' }}>{rel.node.name}</span>
							<button
								onClick={() => removeLink(rel.linkIndex)}
								style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', fontSize: '0.8rem', padding: 0 }}
							>
								x
							</button>
						</span>
					))}
						<button style={{ ...btnStyle, marginLeft: '0.5rem', fontSize: '0.8rem' }} onClick={() => { setAddingRelation('child'); setShowNewPersonForm(false); setSearchQuery('') }}>
						+ Add
					</button>
				</div>

				{/* Add Relationship Dialog */}
				{addingRelation && (
					<div style={{
						marginTop: '1rem',
						padding: '0.75rem',
						border: '1px solid var(--grey-light-soft)',
						borderRadius: '0.5rem',
					}}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
							<span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
								Add {addingRelation}
							</span>
							<button onClick={() => setAddingRelation(null)} style={{ ...btnStyle, padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
								Cancel
							</button>
						</div>

						{!showNewPersonForm && (
							<>
								<input
									style={inputStyle}
									placeholder='Search by name...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									autoFocus
								/>

								{searchResults.length > 0 && (
									<div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
										{searchResults.map((person) => (
											<div
												key={person.id}
												onClick={() => handleAddExistingPerson(person.id)}
												style={{
													padding: '0.4rem',
													cursor: 'pointer',
													borderRadius: '0.25rem',
													fontSize: '0.85rem',
													display: 'flex',
													alignItems: 'center',
													gap: '0.5rem',
												}}
											>
												<span style={{
													width: '8px',
													height: '8px',
													borderRadius: '50%',
													background: person.color,
													display: 'inline-block',
												}}></span>
												{person.name} {person.yob ? `(${person.yob})` : ''}
											</div>
										))}
									</div>
								)}
							</>
						)}

						<div style={{ marginTop: '0.5rem' }}>
							{!showNewPersonForm ? (
								<button style={{ ...btnStyle, width: '100%', fontSize: '0.8rem' }} onClick={() => setShowNewPersonForm(true)}>
									Create New Person
								</button>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
									<input
										style={inputStyle}
										placeholder='First name'
										value={newPerson.firstName}
										onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
									/>
									<input
										style={inputStyle}
										placeholder='Surname'
										value={newPerson.surname}
										onChange={(e) => setNewPerson({ ...newPerson, surname: e.target.value })}
									/>
									<select
										style={inputStyle}
										value={newPerson.gender}
										onChange={(e) => setNewPerson({ ...newPerson, gender: e.target.value })}
									>
										<option value='U'>Unspecified</option>
										<option value='F'>Female</option>
										<option value='M'>Male</option>
									</select>
									<input
										style={inputStyle}
										placeholder='Birth year'
										value={newPerson.yob}
										onChange={(e) => setNewPerson({ ...newPerson, yob: e.target.value })}
									/>
									<button
										style={btnPrimaryStyle}
										onClick={handleCreateAndLink}
										disabled={!newPerson.firstName}
									>
										Create & Link
									</button>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Delete */}
				<div style={{ marginTop: '2rem', borderTop: '1px solid var(--grey-light-soft)', paddingTop: '1rem' }}>
					{!showDeleteConfirm ? (
						<button style={{ ...btnDangerStyle, width: '100%' }} onClick={() => setShowDeleteConfirm(true)}>
							Delete Person
						</button>
					) : (
						<div style={{ textAlign: 'center' }}>
							<p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
								Delete {node.name}? This will remove all their relationships.
							</p>
							<div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
								<button style={btnDangerStyle} onClick={() => removeNode(node.id)}>
									Yes, Delete
								</button>
								<button style={btnStyle} onClick={() => setShowDeleteConfirm(false)}>
									Cancel
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default EditPanel

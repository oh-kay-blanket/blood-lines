import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Reconstruct FAM records from the flat links array
function buildFamilies(nodes, links) {
	const families = []
	const familyMap = {} // key: "husbId-wifeId" or "parentId" → family index

	// First pass: find all spouse pairs
	links.forEach((link) => {
		const srcId = typeof link.source === 'object' ? link.source.id : link.source
		const tgtId = typeof link.target === 'object' ? link.target.id : link.target

		const isSpouseLink =
			(link.sourceType === 'HUSB' || link.sourceType === 'WIFE') &&
			(link.targetType === 'HUSB' || link.targetType === 'WIFE')

		if (isSpouseLink) {
			// Determine who is HUSB and who is WIFE
			let husbId, wifeId
			if (link.sourceType === 'HUSB') {
				husbId = srcId
				wifeId = tgtId
			} else {
				husbId = tgtId
				wifeId = srcId
			}

			const key = `${husbId}-${wifeId}`
			const reverseKey = `${wifeId}-${husbId}`

			if (!familyMap[key] && !familyMap[reverseKey]) {
				const famIndex = families.length
				families.push({ husb: husbId, wife: wifeId, children: [] })
				familyMap[key] = famIndex
				familyMap[reverseKey] = famIndex
			}
		}
	})

	// Second pass: find all parent-child links
	links.forEach((link) => {
		const srcId = typeof link.source === 'object' ? link.source.id : link.source
		const tgtId = typeof link.target === 'object' ? link.target.id : link.target

		// Parent → Child link: source is parent (HUSB/WIFE), target is CHIL
		if (link.targetType === 'CHIL' && (link.sourceType === 'HUSB' || link.sourceType === 'WIFE')) {
			const parentId = srcId
			const childId = tgtId

			// Find a family that has this parent
			let foundFamily = false
			for (let i = 0; i < families.length; i++) {
				if (families[i].husb === parentId || families[i].wife === parentId) {
					if (families[i].children.indexOf(childId) === -1) {
						families[i].children.push(childId)
					}
					foundFamily = true
					break
				}
			}

			// Single-parent family
			if (!foundFamily) {
				const singleKey = `single-${parentId}`
				if (familyMap[singleKey] !== undefined) {
					const fi = familyMap[singleKey]
					if (families[fi].children.indexOf(childId) === -1) {
						families[fi].children.push(childId)
					}
				} else {
					const famIndex = families.length
					const parentNode = nodes.find((n) => n.id === parentId)
					const parentGender = parentNode ? parentNode.gender : 'M'
					if (parentGender === 'F') {
						families.push({ husb: null, wife: parentId, children: [childId] })
					} else {
						families.push({ husb: parentId, wife: null, children: [childId] })
					}
					familyMap[singleKey] = famIndex
				}
			}
		}

		// Child → Parent link: source is CHIL, target is parent
		if (link.sourceType === 'CHIL' && (link.targetType === 'HUSB' || link.targetType === 'WIFE')) {
			const parentId = tgtId
			const childId = srcId

			let foundFamily = false
			for (let i = 0; i < families.length; i++) {
				if (families[i].husb === parentId || families[i].wife === parentId) {
					if (families[i].children.indexOf(childId) === -1) {
						families[i].children.push(childId)
					}
					foundFamily = true
					break
				}
			}

			if (!foundFamily) {
				const singleKey = `single-${parentId}`
				if (familyMap[singleKey] !== undefined) {
					const fi = familyMap[singleKey]
					if (families[fi].children.indexOf(childId) === -1) {
						families[fi].children.push(childId)
					}
				} else {
					const famIndex = families.length
					const parentNode = nodes.find((n) => n.id === parentId)
					const parentGender = parentNode ? parentNode.gender : 'M'
					if (parentGender === 'F') {
						families.push({ husb: null, wife: parentId, children: [childId] })
					} else {
						families.push({ husb: parentId, wife: null, children: [childId] })
					}
					familyMap[singleKey] = famIndex
				}
			}
		}
	})

	return families
}

// Check if a date/year value is meaningful for export
function isValidDate(val) {
	return val && val !== '?' && val !== 'Present'
}

// Sanitize an ID to be GEDCOM-safe (alphanumeric + underscores)
function sanitizeId(id) {
	return String(id).replace(/[^a-zA-Z0-9_]/g, '')
}

// Export d3Data to GEDCOM 5.5.1 string
export function exportToGedcom(d3Data, photoStore = {}) {
	const { nodes, links } = d3Data
	const families = buildFamilies(nodes, links)
	const lines = []

	// HEAD
	lines.push('0 HEAD')
	lines.push('1 SOUR family-plot')
	lines.push('2 NAME Family Plot')
	lines.push('2 VERS 1.0')
	lines.push('1 GEDC')
	lines.push('2 VERS 5.5.1')
	lines.push('2 FORM LINEAGE-LINKED')
	lines.push('1 CHAR UTF-8')

	// Build FAMC/FAMS maps for INDI records
	const famcMap = {} // childId → [famId]
	const famsMap = {} // spouseId → [famId]

	families.forEach((fam, i) => {
		const famId = `@F${i}@`
		if (fam.husb) {
			if (!famsMap[fam.husb]) famsMap[fam.husb] = []
			famsMap[fam.husb].push(famId)
		}
		if (fam.wife) {
			if (!famsMap[fam.wife]) famsMap[fam.wife] = []
			famsMap[fam.wife].push(famId)
		}
		fam.children.forEach((childId) => {
			if (!famcMap[childId]) famcMap[childId] = []
			famcMap[childId].push(famId)
		})
	})

	// OBJE record tracking
	const objeRecords = []

	// INDI records
	nodes.forEach((node) => {
		const indiId = `@${sanitizeId(node.id)}@`
		lines.push(`0 ${indiId} INDI`)

		// NAME
		const surname = node.surname || ''
		const firstName = node.firstName && node.firstName !== '?' ? node.firstName : ''
		if (surname || firstName) {
			lines.push(`1 NAME ${firstName} /${surname}/`)
			if (firstName) lines.push(`2 GIVN ${firstName}`)
			if (surname) lines.push(`2 SURN ${surname}`)
		}

		// SEX
		if (node.gender) {
			lines.push(`1 SEX ${node.gender}`)
		}

		// BIRT
		if (isValidDate(node.dob) || isValidDate(node.yob) || node.pob) {
			lines.push('1 BIRT')
			if (isValidDate(node.dob)) {
				lines.push(`2 DATE ${node.dob}`)
			} else if (isValidDate(node.yob)) {
				lines.push(`2 DATE ${node.yob}`)
			}
			if (node.pob) {
				lines.push(`2 PLAC ${node.pob}`)
			}
		}

		// DEAT
		if (isValidDate(node.dod) || isValidDate(node.yod) || node.pod) {
			lines.push('1 DEAT')
			if (isValidDate(node.dod)) {
				lines.push(`2 DATE ${node.dod}`)
			} else if (isValidDate(node.yod)) {
				lines.push(`2 DATE ${node.yod}`)
			}
			if (node.pod) {
				lines.push(`2 PLAC ${node.pod}`)
			}
		}

		// TITL
		if (node.title) {
			lines.push(`1 TITL ${node.title}`)
		}

		// NOTE (bio)
		if (node.bio) {
			lines.push(`1 NOTE ${node.bio}`)
		}

		// FAMC
		if (famcMap[node.id]) {
			famcMap[node.id].forEach((famId) => {
				lines.push(`1 FAMC ${famId}`)
			})
		}

		// FAMS
		if (famsMap[node.id]) {
			famsMap[node.id].forEach((famId) => {
				lines.push(`1 FAMS ${famId}`)
			})
		}

		// OBJE reference for photos
		if (photoStore[node.id]) {
			const objeId = `@O${sanitizeId(node.id)}@`
			lines.push(`1 OBJE ${objeId}`)

			// Determine file extension from data URL
			const dataUrl = photoStore[node.id]
			let ext = 'jpg'
			if (dataUrl.startsWith('data:image/png')) ext = 'png'
			else if (dataUrl.startsWith('data:image/gif')) ext = 'gif'
			else if (dataUrl.startsWith('data:image/webp')) ext = 'webp'

			objeRecords.push({
				id: objeId,
				file: `photos/${sanitizeId(node.id)}.${ext}`,
				form: ext,
				title: node.name || `${firstName} ${surname}`.trim(),
			})
		}
	})

	// FAM records
	families.forEach((fam, i) => {
		const famId = `@F${i}@`
		lines.push(`0 ${famId} FAM`)
		if (fam.husb) lines.push(`1 HUSB @${sanitizeId(fam.husb)}@`)
		if (fam.wife) lines.push(`1 WIFE @${sanitizeId(fam.wife)}@`)
		fam.children.forEach((childId) => {
			lines.push(`1 CHIL @${sanitizeId(childId)}@`)
		})
	})

	// OBJE records
	objeRecords.forEach((obje) => {
		lines.push(`0 ${obje.id} OBJE`)
		lines.push(`1 FILE ${obje.file}`)
		lines.push(`2 FORM ${obje.form}`)
		lines.push(`2 TITL ${obje.title}`)
	})

	// TRLR
	lines.push('0 TRLR')

	return lines.join('\n')
}

// Convert data URL to blob
function dataUrlToBlob(dataUrl) {
	const parts = dataUrl.split(',')
	const mime = parts[0].match(/:(.*?);/)[1]
	const bstr = atob(parts[1])
	const n = bstr.length
	const u8arr = new Uint8Array(n)
	for (let i = 0; i < n; i++) {
		u8arr[i] = bstr.charCodeAt(i)
	}
	return new Blob([u8arr], { type: mime })
}

// Get file extension from data URL
function getExtFromDataUrl(dataUrl) {
	if (dataUrl.startsWith('data:image/png')) return 'png'
	if (dataUrl.startsWith('data:image/gif')) return 'gif'
	if (dataUrl.startsWith('data:image/webp')) return 'webp'
	return 'jpg'
}

// Export as .ged file (plain GEDCOM, no photos)
export function downloadGedcom(d3Data, photoStore = {}) {
	const gedcom = exportToGedcom(d3Data, photoStore)
	const blob = new Blob([gedcom], { type: 'text/plain;charset=utf-8' })
	saveAs(blob, 'family-tree.ged')
}

// Export as .gedz file (ZIP with GEDCOM + photos)
export async function downloadGedz(d3Data, photoStore = {}) {
	const gedcom = exportToGedcom(d3Data, photoStore)
	const zip = new JSZip()

	zip.file('tree.ged', gedcom)

	// Add photos
	const photosFolder = zip.folder('photos')
	Object.keys(photoStore).forEach((nodeId) => {
		const dataUrl = photoStore[nodeId]
		const ext = getExtFromDataUrl(dataUrl)
		const blob = dataUrlToBlob(dataUrl)
		photosFolder.file(`${sanitizeId(nodeId)}.${ext}`, blob)
	})

	const content = await zip.generateAsync({ type: 'blob' })
	saveAs(content, 'family-tree.gedz')
}

// Import a .gedz file - returns { gedcomText, photos: {nodeId: dataUrl} }
export async function importGedz(file) {
	const zip = await JSZip.loadAsync(file)

	// Find the .ged file
	let gedcomText = null
	const photos = {}

	for (const [path, zipEntry] of Object.entries(zip.files)) {
		if (path.endsWith('.ged')) {
			gedcomText = await zipEntry.async('string')
		} else if (path.startsWith('photos/') && !zipEntry.dir) {
			const blob = await zipEntry.async('blob')
			const dataUrl = await new Promise((resolve) => {
				const reader = new FileReader()
				reader.onload = () => resolve(reader.result)
				reader.readAsDataURL(blob)
			})
			// Extract node ID from filename (e.g., "photos/I001.jpg" → "I001")
			const filename = path.split('/').pop()
			const nodeId = filename.replace(/\.[^.]+$/, '')
			photos[nodeId] = dataUrl
		}
	}

	return { gedcomText, photos }
}

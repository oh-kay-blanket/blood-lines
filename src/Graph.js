// Modules
import React, { useEffect, useRef, useCallback } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import SpriteText from 'three-spritetext'
import { forceCollide } from 'd3-force-3d'
import Hammer from 'hammerjs'

const Graph = ({
	d3Data,
	highlights,
	setHighlights,
	highlightedFamily,
	showingLegend,
	setShowingLegend,
	showingSurnames,
	setShowingSurnames,
	isMobile,
	clearHighlights,
	theme,
	nameFormat,
}) => {
	// console.log(`d3Data`, d3Data)

	// STATE //
	const fgRef = useRef()

	const raycaster = new THREE.Raycaster()
	const mouse = new THREE.Vector2()
	const justPinchedRef = useRef(false)

	// THEME COLORS
	const themeColors =
		theme === 'light'
			? {
					label: '#181818',
					labelBg: '#fff',
					labelBorder: '#666',
					muted: '#4443',
					mutedBg: '#fff2',
					mutedBorder: '#ccc3',
					timeline: 0xe0e0e0,
					timelineText: '#181818',
					romantic: 'rgba(255, 165, 0, 0.6)',
					normal: 'rgba(252, 103, 103, 0.3)',
					mutedLink: 'rgba(200,200,200,0.15)',
					highlighted: 'rgba(237, 74, 73, 0.4)',
					background: '#fcfaf4',
					padding: 4,
			  }
			: {
					label: '#fcfaf4',
					labelBg: '#1a1a1acc',
					labelBorder: '#444',
					muted: '#6665',
					mutedBg: '#2222',
					mutedBorder: '#5555',
					timeline: 0x555555,
					timelineText: '#f8f8f8',
					romantic: 'rgba(255, 215, 0, 0.5)',
					normal: 'rgba(252, 103, 103, 0.3)',
					mutedLink: 'rgba(167, 98, 98, 0.15)',
					highlighted: 'rgba(252, 103, 103, 0.6)',
					background: '#1a1a1a',
					padding: 3,
			  }

	// DESIGN //

	const setNodeThreeObject = useCallback(
		(node) => {
			// Use a sphere as a drag handle
			const obj = new THREE.Mesh(
				new THREE.SphereGeometry(25),
				new THREE.MeshBasicMaterial({
					depthWrite: false,
					transparent: true,
					opacity: 0,
				})
			)

			// Add text sprite as child
			let name
			if (node.firstName == '?') {
				name = node.name
			} else {
				name = nameFormat === 'lastFirst'
					? `${node.surname}, ${node.firstName}`
					: `${node.firstName} ${node.surname}`
			}
			let sprite = new SpriteText(name)

			// Sprite defaults
			const coloredSprite = () => {
				sprite.color = '#000'
				sprite.backgroundColor = node.color
				sprite.borderColor = themeColors.labelBorder
			}

			const greyedSprite = () => {
				sprite.color = themeColors.muted
				sprite.backgroundColor = '#0000'
				sprite.borderColor = themeColors.mutedBorder
			}

			// NODE.COLOR
			// No highlighted node
			if (highlights.node === null) {
				if (highlightedFamily) {
					if (highlightedFamily === node.surname) {
						coloredSprite()
					} else {
						greyedSprite()
					}
				} else {
					coloredSprite()
				}
			} else {
				if (highlights.family.indexOf(node.id) !== -1) {
					coloredSprite()
				} else {
					greyedSprite()
				}
			}

			sprite.fontFace = 'Inter'
			sprite.fontWeight = 700
			sprite.textHeight = 10
			sprite.borderWidth = 0.4
			sprite.borderRadius = 8
			sprite.padding = themeColors.padding
			obj.add(sprite)
			return obj
		},
		[highlights, highlightedFamily, themeColors, nameFormat]
	)

	// Link color
	const getLinkColor = useCallback(
		(link) => {
			return highlights.links.length < 1
				? highlightedFamily
					? themeColors.mutedLink // Highlighed family exists, mute all links
					: link.sourceType != 'CHIL' && link.targetType != 'CHIL'
					? themeColors.romantic // Romantic link
					: themeColors.normal // Normal link
				: highlights.links.indexOf(link.index) !== -1
				? link.sourceType != 'CHIL' && link.targetType != 'CHIL'
					? themeColors.romantic // Romantic link
					: themeColors.highlighted // Highlighted link
				: themeColors.mutedLink // Muted link
		},
		[highlights, highlightedFamily, themeColors]
	)

	// Link width
	const getLinkWidth = useCallback(
		(link) => {
			if (highlights.links.indexOf(link.index) !== -1) {
				return 1.5
			} else {
				return 1.5
			}
		},
		[highlights]
	)

	// Link particles
	const getLinkParticleWidth = useCallback(
		(link) => {
			if (highlights.links.indexOf(link.index) !== -1) {
				return 2
			} else {
				return 0.1
			}
		},
		[highlights]
	)

	// USE EFFECT
	useEffect(() => {
		// Manage force
		fgRef.current.d3Force('collide', forceCollide(55))

		// Add timeline //
		;(function () {
			// Get list of fixed Y
			let yRange = d3Data.nodes.map((node) => Number(node.fy))

			// Filter out NaN
			yRange = yRange.filter((node) => !isNaN(node) && node)

			// TIMELINE
			const highestY = Math.max.apply(Math, yRange)
			const lowestY = Math.min.apply(Math, yRange)

			// Create a blue LineBasicMaterial
			var material = new THREE.LineBasicMaterial({
				color: themeColors.timeline,
				linewidth: 2,
			})

			var points = []
			points.push(new THREE.Vector3(0, lowestY, 0))
			points.push(new THREE.Vector3(0, highestY, 0))

			var geometry = new THREE.BufferGeometry().setFromPoints(points)

			var line = new THREE.Line(geometry, material)

			fgRef.current.scene().add(line)
		})()

		// Add timeline years
		;(function () {
			// All YOBs
			let years = d3Data.nodes.map((node) => Number(node.yob))

			// Filter out NaN
			years = years.filter((year) => !isNaN(year))

			// Get list of fixed Y
			let yRange = d3Data.nodes.map((node) => Number(node.fy))

			// Filter out NaN
			yRange = yRange.filter((node) => !isNaN(node) && node)

			// TIMELINE
			const highestY = Math.max.apply(Math, yRange)
			const lowestY = Math.min.apply(Math, yRange)
			const halfY = (highestY + lowestY) / 2
			const quarterY = (halfY + lowestY) / 2
			const threeQuarterY = (halfY + highestY) / 2

			const earliestYOB = Math.min.apply(Math, years)
			const latestYOB = Math.max.apply(Math, years)
			const halfYOB = parseInt((earliestYOB + latestYOB) / 2)
			const quarterYOB = parseInt((latestYOB + halfYOB) / 2)
			const threeQuarterYOB = parseInt((earliestYOB + halfYOB) / 2)

			// EARLIEST
			let earliest = new THREE.Mesh(
				new THREE.SphereGeometry(100),
				new THREE.MeshBasicMaterial({
					depthWrite: false,
					transparent: true,
					opacity: 0,
				})
			)

			earliest.position.y = highestY + 15

			let earliestTimeLabel = earliestYOB
				? new SpriteText(earliestYOB)
				: new SpriteText('Earlier')
			earliestTimeLabel.color = themeColors.timelineText
			earliestTimeLabel.fontFace = 'Josefin Sans'
			earliestTimeLabel.fontWeight = '700'
			earliestTimeLabel.fontStyle = 'italic'
			earliestTimeLabel.textHeight = 25
			earliest.add(earliestTimeLabel)

			// LATEST
			let latest = new THREE.Mesh(
				new THREE.SphereGeometry(100),
				new THREE.MeshBasicMaterial({
					depthWrite: false,
					transparent: true,
					opacity: 0,
				})
			)

			latest.position.y = lowestY - 15

			let latestTimeLabel = latestYOB
				? new SpriteText(latestYOB)
				: new SpriteText('Later')
			latestTimeLabel.color = themeColors.timelineText
			latestTimeLabel.fontFace = 'Josefin Sans'
			latestTimeLabel.fontWeight = '700'
			latestTimeLabel.fontStyle = 'italic'
			latestTimeLabel.textHeight = 25
			latest.add(latestTimeLabel)

			// HALF
			let half = new THREE.Mesh(
				new THREE.SphereGeometry(100),
				new THREE.MeshBasicMaterial({
					depthWrite: false,
					transparent: true,
					opacity: 0,
				})
			)

			half.position.y = halfY

			let halfTimeLabel = new SpriteText(halfYOB)
			halfTimeLabel.color = themeColors.timelineText
			halfTimeLabel.fontFace = 'Josefin Sans'
			halfTimeLabel.fontWeight = '700'
			halfTimeLabel.fontStyle = 'italic'
			halfTimeLabel.textHeight = 15
			half.add(halfTimeLabel)

			// QUARTER
			let quarter = new THREE.Mesh(
				new THREE.SphereGeometry(100),
				new THREE.MeshBasicMaterial({
					depthWrite: false,
					transparent: true,
					opacity: 0,
				})
			)

			quarter.position.y = quarterY

			let quarterTimeLabel = new SpriteText(quarterYOB)
			quarterTimeLabel.color = themeColors.timelineText
			quarterTimeLabel.fontFace = 'Josefin Sans'
			quarterTimeLabel.fontWeight = '700'
			quarterTimeLabel.fontStyle = 'italic'
			quarterTimeLabel.textHeight = 15
			quarter.add(quarterTimeLabel)

			// QUARTER
			let threeQuarter = new THREE.Mesh(
				new THREE.SphereGeometry(100),
				new THREE.MeshBasicMaterial({
					depthWrite: false,
					transparent: true,
					opacity: 0,
				})
			)

			threeQuarter.position.y = threeQuarterY

			let threeQuarterTimeLabel = new SpriteText(threeQuarterYOB)
			threeQuarterTimeLabel.color = themeColors.timelineText
			threeQuarterTimeLabel.fontFace = 'Josefin Sans'
			threeQuarterTimeLabel.fontWeight = '700'
			threeQuarterTimeLabel.fontStyle = 'italic'
			threeQuarterTimeLabel.textHeight = 15
			threeQuarter.add(threeQuarterTimeLabel)

			fgRef.current.scene().add(earliest)
			fgRef.current.scene().add(latest)
			highestY - lowestY > 300 && fgRef.current.scene().add(half)
			highestY - lowestY > 450 && fgRef.current.scene().add(quarter)
			highestY - lowestY > 450 && fgRef.current.scene().add(threeQuarter)
		})()

		// controls
		fgRef.current.controls().enableDamping = true
		fgRef.current.controls().dampingFactor = 0.3
		fgRef.current.controls().rotateSpeed = 0.8
		fgRef.current.controls().screenSpacePanning = true
	}, [d3Data, themeColors])

	// LOGIC //

	// Handle node click
	const handleNodeClick = (node) => {
		clearHighlights()

		// Only action if new node is clicked
		if (highlights.node !== node) {
			let tempHighlights = {
				node: node,
				family: [node.id],
				links: [],
				spouses: [],
				notDescendent: [],
			}
			const cloneable = { ...tempHighlights }
			delete cloneable.node

			// Build nuclear family
			d3Data.links.forEach((link) => {
				if (link.source.id === node.id) {
					tempHighlights.family.push(link.target.id)
					tempHighlights.links.push(link.index)
					if (
						(link.sourceType === 'WIFE' || link.sourceType === 'HUSB') &&
						(link.targetType === 'WIFE' || link.targetType === 'HUSB')
					) {
						tempHighlights.spouses.push(link.target.id)
					}
					if (link.targetType !== 'CHIL') {
						tempHighlights.notDescendent.push(link.target.id)
					}
				} else if (link.target.id === node.id) {
					tempHighlights.family.push(link.source.id)
					tempHighlights.links.push(link.index)
					if (
						(link.sourceType === 'WIFE' || link.sourceType === 'HUSB') &&
						(link.targetType === 'WIFE' || link.targetType === 'HUSB')
					) {
						tempHighlights.spouses.push(link.source.id)
					}
					tempHighlights.notDescendent.push(link.source.id)
				}
			})

			// Build parental lines
			const buildParentLines = (parentTempHighlights) => {
				d3Data.links.forEach((link) => {
					if (
						parentTempHighlights.family.indexOf(link.target.id) !== -1 &&
						parentTempHighlights.family.indexOf(link.source.id) === -1 &&
						parentTempHighlights.spouses.indexOf(link.target.id) === -1 &&
						link.sourceType != 'CHIL' &&
						link.targetType != 'WIFE'
					) {
						parentTempHighlights.family.push(link.source.id)
						parentTempHighlights.links.push(link.index)
					}
				})
			}

			let parentTempHighlights = structuredClone(cloneable)
			while (true) {
				const lengthBefore = parentTempHighlights.family.length
				buildParentLines(parentTempHighlights)
				const lengthAfter = parentTempHighlights.family.length
				if (lengthAfter === lengthBefore) {
					break // Exit loop if array length didn't change
				}
			}

			// Build descendent lines
			const buildDescendentLines = (descendentTempHighlights) => {
				d3Data.links.forEach((link) => {
					if (
						descendentTempHighlights.family.indexOf(link.source.id) !== -1 &&
						descendentTempHighlights.family.indexOf(link.target.id) === -1 &&
						descendentTempHighlights.notDescendent.indexOf(link.source.id) ===
							-1 &&
						link.targetType === 'CHIL'
					) {
						descendentTempHighlights.family.push(link.target.id)
						descendentTempHighlights.links.push(link.index)
					}
				})
			}
			// Remove duplicates
			tempHighlights.family = [...new Set(tempHighlights.family)]
			tempHighlights.links = [...new Set(tempHighlights.links)]

			let descendentTempHighlights = structuredClone(cloneable)
			while (true) {
				const lengthBefore = descendentTempHighlights.family.length
				buildDescendentLines(descendentTempHighlights)
				const lengthAfter = descendentTempHighlights.family.length
				console.log('lengthBefore', lengthBefore)
				console.log('lengthAfter', lengthAfter)
				if (lengthAfter === lengthBefore) {
					console.log("descendentLines length didn't change, exiting loop")
					break // Exit loop if array length didn't change
				}
			}

			tempHighlights.family.push(...parentTempHighlights.family)
			tempHighlights.links.push(...parentTempHighlights.links)
			tempHighlights.family.push(...descendentTempHighlights.family)
			tempHighlights.links.push(...descendentTempHighlights.links)

			// Remove duplicates
			tempHighlights.family = [...new Set(tempHighlights.family)]
			tempHighlights.links = [...new Set(tempHighlights.links)]

			// Set highlights
			console.log('highlights', tempHighlights)
			setHighlights(tempHighlights)
		}
	}

	// Handle touch events for mobile
	useEffect(() => {
		if (!isMobile) return

		const canvas = fgRef.current?.renderer().domElement
		if (!canvas) return

		const hammer = new Hammer.Manager(canvas)
		const singleTap = new Hammer.Tap({ event: 'singletap' })
		const pinch = new Hammer.Pinch()

		pinch.recognizeWith(singleTap)
		hammer.add([singleTap, pinch])

		hammer.on('singletap', (ev) => {
			const bounds = canvas.getBoundingClientRect()
			mouse.x = ((ev.center.x - bounds.left) / bounds.width) * 2 - 1
			mouse.y = -((ev.center.y - bounds.top) / bounds.height) * 2 + 1

			raycaster.setFromCamera(mouse, fgRef.current.camera())
			const intersects = raycaster.intersectObjects(
				fgRef.current.scene().children,
				true
			)
			const nodeObject = intersects.find(
				(intersect) => intersect.object.__data && intersect.object.__data.id
			)

			if (nodeObject) {
				const node = nodeObject.object.__data
				console.log(node)
				if (navigator.vibrate) navigator.vibrate(25)
				handleNodeClick(node)
			} else if (showingSurnames || showingLegend) {
				setShowingSurnames(false)
				setShowingLegend(false)
			} else {
				clearHighlights()
			}
		})

		hammer.on('pinchstart', () => {
			justPinchedRef.current = true
		})

		hammer.on('pinchend', () => {
			setTimeout(() => {
				justPinchedRef.current = false
			}, 500)
		})

		return () => {
			hammer.destroy()
		}
	}, [highlights, showingSurnames, showingLegend])

	// BUILD GRAPH //
	return (
		<ForceGraph3D
			ref={fgRef}
			graphData={d3Data}
			// Display
			width={window.innerWidth}
			height={window.innerHeight}
			backgroundColor={themeColors.background}
			showNavInfo={false}
			// Controls
			controlType={'orbit'}
			enableNodeDrag={false}
			onBackgroundClick={isMobile ? undefined : clearHighlights}
			// Nodes
			nodeThreeObject={setNodeThreeObject}
			nodeLabel={null}
			onNodeClick={!isMobile ? (node) => handleNodeClick(node) : undefined}
			onNodeDragEnd={() => {
				if (touchTimeout) {
					clearTimeout(touchTimeout)
					touchTimeout = null
				}
			}}
			// LINKS
			linkLabel={null}
			linkColor={getLinkColor}
			linkOpacity={1}
			linkWidth={getLinkWidth}
			linkDirectionalParticles={(link) =>
				link.sourceType != 'CHIL' &&
				link.targetType == 'CHIL' &&
				d3Data.nodes.length < 300
					? 8
					: 0
			}
			linkDirectionalParticleWidth={getLinkParticleWidth}
			linkDirectionalParticleSpeed={0.001}
		/>
	)
}

export default Graph

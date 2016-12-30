/* global APPNAME, VERSION */
'use strict'

import { info } from './debug.js'
import Blyde from 'blyde'
const $ = Blyde

import content from './main.html'
import ew from './res/egg-w.svg'
import ey from './res/egg-y.svg'
import './style/style.css'

// Set default properties
const props = {
	fps: 0,
	tg: 0
}

/* Base64 conversion
** from http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
** modified for actual usage
*/
const b64toBlobUrl = (b64Str, sliceSize = 512) => {
	const [type, b64Data] = b64Str.split(','),
		contentType = type.split(':')[1].split(';')[0],
		byteCharacters = atob(b64Data),
		byteArrays = []

	for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		const slice = byteCharacters.slice(offset, offset + sliceSize)

		const byteNumbers = new Array(slice.length)
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i)
		}

		const byteArray = new Uint8Array(byteNumbers)
		byteArrays.push(byteArray)
	}

	const blob = new Blob(byteArrays, {type: contentType})
	return URL.createObjectURL(blob)
}

// Get images from base64 data
const eggw = b64toBlobUrl(ew.src),
	eggy = b64toBlobUrl(ey.src)

// Handle user properties
window.wallpaperPropertyListener = {
	applyGeneralProperties(up) {
		if (up.fps) {
			props.fps = up.fps
			props.tg = 1000 / up.fps
			info('FPS limitation updated, current FPS limitation is', props.fps, 'timegap is', props.tg)
		}
	}
}

$(() => {
	// Prepare the frying pan
	const pan = $.q('body')
	pan.$el.insertAdjacentHTML('afterbegin', content)

	// Put in the egg!
	const w = pan.q('.egg.w'),
		y = pan.q('.egg.y')
	w.$el.style.backgroundImage = `url("${eggw}")`
	y.$el.style.backgroundImage = `url("${eggy}")`

	// Set the stop point
	const sp = 0.2

	// Initialize virables
	let mouseX = window.innerWidth / 2,
		mouseY = window.innerHeight / 2,
		fpsThreshold = 0,
		last = 0,
		diffX = 0,
		diffY = 0,
		wX = 0,
		wY = 0,
		yX = 0,
		yY = 0,
		wS = 1,
		yS = 1

	// Apply changes to view
	const update = () => {
		w.$el.style.transform = `translate3D(${wX}px, ${wY}px, 0) scale(${wS})`
		y.$el.style.transform = `translate3D(${yX}px, ${yY}px, 0) scale(${yS})`
	}

	// Pause animation to save CPU when not active
	const pause = () => {
		fpsThreshold = 0
		last = 0
		diffX = 0
		diffY = 0
		wX = 0
		wY = 0
		yX = 0
		yY = 0
		wS = 1
		yS = 1
		update()
		info('Animation paused.')
	}

	// Calculation on each frame
	const tick = () => {
		const moveX = diffX / 30,
			moveY = diffY / 30,
			now = performance.now(),
			dt = now - last
		last = now
		diffX -= moveX
		diffY -= moveY
		wX += (moveX - wX / 40) / 2
		wY += (moveY - wY / 40) / 2
		yX += (moveX - yX / 30) / 1.5 + (wX - yX) / 30
		yY += (moveY - yY / 30) / 1.5 + (wY - yY) / 30

		// Start Next tick
		if (Math.abs(wX) + Math.abs(wY) + Math.abs(yX) + Math.abs(yY) < sp && wS + yS === 2) return pause()
		window.requestAnimationFrame(tick)

		// Limit FPS
		if (props.fps > 0) {
			fpsThreshold += dt
			if (fpsThreshold > props.tg) fpsThreshold = props.tg
			if (fpsThreshold < props.tg) return
			fpsThreshold -= props.tg
		}

		update()
	}

	// Handle if start the animation
	const start = () => {
		if (last !== 0) return
		last = performance.now()
		window.requestAnimationFrame(tick)
		info('Animation started.')
	}

	// Listen mouse move events
	$.on('mousemove', (e) => {
		diffX += e.clientX - mouseX
		diffY += e.clientY - mouseY
		mouseX = e.clientX
		mouseY = e.clientY

		// Start animation
		start()
	})

	// Handle audio info updates
	const audioListener = (audioArray) => {
		const gap = audioArray.length / 4
		let lf = 0,
			hf = 0
		for (let i = 0; i < gap; i++) {
			lf += audioArray[i] + audioArray[i + gap * 2]
			hf += audioArray[i + gap] + audioArray[i + gap * 3]
		}
		wS = 1 + (lf / gap) / 2
		yS = 1 + (hf / gap) / 2
		// Start animation
		start()
	}

	// Listen audio updates
	window.wallpaperRegisterAudioListener(audioListener)

	info(`${APPNAME} v${VERSION} started!`)
})

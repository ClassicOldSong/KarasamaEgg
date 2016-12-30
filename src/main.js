/* global APPNAME, VERSION */
'use strict'

import { info } from './debug.js'

import content from './main.html'
import ew from './res/egg-w.svg'
import ey from './res/egg-y.svg'
import './style/style.css'

// Set default properties
const props = {
	fps: 0,
	tg: 0
}

const $ = selector => document.querySelector(selector)

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

const init = () => {
	// Remove the init listener
	document.removeEventListener('DOMContentLoaded', init, false)

	// Prepare the frying pan
	$('body').insertAdjacentHTML('afterbegin', content)
	const pr = window.devicePixelRatio || 1,
		c = $('.egg'),
		wW = window.innerWidth,
		wH = window.innerHeight
	let bL = 0,
		bT = 0,
		bS = 1
	c.width = wW * pr
	c.height = wH * pr
	if (wW / wH > ew.width / ew.height) {
		bS = wH / ew.height
		bL = (wW - bS * ew.width) / 2
	} else {
		bS = wW / ew.width
		bT = (wH - bS * ew.height) / 2
	}

	const iW = ew.width * bS,
		iH = ew.height * bS

	const pan = c.getContext('2d')
	pan.scale(pr, pr)

	pan.drawImage(ew, bL, bT, iW, iH)
	pan.drawImage(ey, bL, bT, iW, iH)

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
		const wdW = iW * wS,
			wdH = iH * wS,
			ydW = iW * yS,
			ydH = iH * yS,
			wpL = (wdW - iW) / 2,
			wpT = (wdH - iH) / 2,
			ypL = (ydW - iW) / 2,
			ypT = (ydH - iH) / 2
		pan.clearRect(0, 0, c.width, c.height)
		pan.drawImage(ew, bL + wX - wpL, bT + wY - wpT, wdW, wdH)
		pan.drawImage(ey, bL + yX - ypL, bT + yY - ypT, ydW, ydH)
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
	window.addEventListener('mousemove', (e) => {
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
}

document.addEventListener('DOMContentLoaded', init, false)

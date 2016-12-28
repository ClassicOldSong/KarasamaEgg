/* global APPNAME, VERSION */
'use strict'

import { info } from './debug.js'
import Blyde from 'blyde'
const $ = Blyde

import content from './main.html'
import ew from './res/egg-w.svg'
import ey from './res/egg-y.svg'
import './style/style.css'

/* Base64 conversion
** from http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
** modified for actual usage
*/
const b64toBlobUrl = (b64Str, sliceSize = 512) => {
	const [type, b64Data] = b64Str.split(',')
	const contentType = type.split(':')[1].split(';')[0]
	const byteCharacters = atob(b64Data)
	const byteArrays = []

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
	const blobUrl = URL.createObjectURL(blob)
	return blobUrl
}

// Get images from base64 data
const eggw = b64toBlobUrl(ew.src)
const eggy = b64toBlobUrl(ey.src)

$(() => {
	// Prepare the frying pan
	const pan = $.q('body')
	pan.$el.insertAdjacentHTML('afterbegin', content)

	// Put in the egg!
	const w = pan.q('.egg.w'),
		y = pan.q('.egg.y')
	w.$el.style.backgroundImage = `url("${eggw}")`
	y.$el.style.backgroundImage = `url("${eggy}")`

	// Listen mouse move events
	let mouseX = window.innerWidth / 2,
		mouseY = window.innerHeight / 2,
		diffX = 0,
		diffY = 0,
		wX = 0,
		wY = 0,
		yX = 0,
		yY = 0
	$.on('mousemove', (e) => {
		diffX += e.clientX - mouseX
		diffY += e.clientY - mouseY
		mouseX = e.clientX
		mouseY = e.clientY
	})

	// Calculation on each frame
	const update = () => {
		const moveX = diffX / 30
		const moveY = diffY / 30
		diffX -= moveX
		diffY -= moveY
		wX += (moveX - wX / 40) / 2
		wY += (moveY - wY / 40) / 2
		yX += (moveX - yX / 30) / 1.5 + (wX - yX) / 30
		yY += (moveY - yY / 30) / 1.5 + (wY - yY) / 30
		w.$el.style.transform = `translate3D(${wX}px, ${wY}px, 0)`
		y.$el.style.transform = `translate3D(${yX}px, ${yY}px, 0)`
		window.requestAnimationFrame(update)
	}

	// Let's start the magic!
	window.requestAnimationFrame(update)

	info(`${APPNAME} v${VERSION} started!`)
})

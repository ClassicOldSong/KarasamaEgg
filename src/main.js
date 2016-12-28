/* global APPNAME, VERSION */
'use strict'

import { info } from './debug.js'
import Blyde from 'blyde'
const $ = Blyde

$(() => {
	info(`${APPNAME} v${VERSION} started!`)
})

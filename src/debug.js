/* global APPNAME */
'use strict'

import logging from 'loglevel'
const appName = `[${APPNAME}]`
const log = console.log.bind(null, appName)
const info = logging.info.bind(null, appName)
const warn = logging.warn.bind(null, appName)
const error = logging.error.bind(null, appName)

if (ENV === 'production') {
	logging.setLevel('error')
} else {
	logging.setLevel('trace')
	info('Debug logging enabled!')
}

export { log, info, warn, error }

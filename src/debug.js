/* global APPNAME */
'use strict'

import logger from 'loglevel'

const appName = `[${APPNAME}]`
const log = console.log.bind(null, appName)
const trace = logger.trace.bind(null, appName)
const debug = logger.debug.bind(null, appName)
const info = logger.info.bind(null, appName)
const warn = logger.warn.bind(null, appName)
const error = logger.error.bind(null, appName)

if (ENV === 'production') {
	logger.setLevel('error')
} else {
	logger.setLevel('trace')
}

info('Debug logging enabled!')

export { log, trace, debug, info, warn, error }

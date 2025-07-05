// Toggle debug mode here
const isDebug = true
const vNumber = '6.0.0'
const changes = 'test new de-compression'

// Configuration for builds
const config = {
	isDebug, // Export isDebug for use in build scripts
	// Build version with dynamic `-debug` suffix
	VERSION: `${vNumber}${isDebug ? '-debug' : ''}`,

	// Change name only in debug mode
	CHANGE_NAME: isDebug ? changes : '',
}

module.exports = config

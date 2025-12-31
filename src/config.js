const isDebug = true // Toggle debug mode here
const vNumber = '5.2.0'
const changes = 'increase margins for hint key' // Don't use characters since this is used for generating debug file names also. TODO: Add regex check to filter chars for preventing console/build debug error

// Configuration for builds
const config = {
	isDebug, // Export isDebug for use in build scripts
	VERSION: `${vNumber}${isDebug ? '-debug' : ''}`, // Build version with dynamic `-debug` suffix
	CHANGE_NAME: isDebug ? changes : '', // Change name only in debug mode
}

module.exports = config

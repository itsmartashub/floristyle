const isDebug = true // Toggle debug mode here
const vNumber = '5.1.1'
const changes = 'fix 123 key for numeric_advanced' // Don't use characters since it's used for generating debug file names also. TODO: Add regex check to filter chars to pevent console/build debug error

// Configuration for builds
const config = {
	isDebug, // Export isDebug for use in build scripts
	VERSION: `${vNumber}${isDebug ? '-debug' : ''}`, // Build version with dynamic `-debug` suffix
	CHANGE_NAME: isDebug ? changes : '', // Change name only in debug mode
}

module.exports = config

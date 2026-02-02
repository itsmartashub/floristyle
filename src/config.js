const isDebug = false // Toggle debug mode here
const vNumber = '6.0.0'
const changes = 'update meta description by adding Futo' // Don't use characters since this is used for generating debug file names also. TODO: Add regex check to filter chars for preventing console/build debug error

// Configuration for builds
const config = {
	isDebug, // Export isDebug for use in build scripts
	VERSION: `${vNumber}${isDebug ? '-debug' : ''}`, // Build version with dynamic `-debug` suffix
	CHANGE_NAME: isDebug ? changes : '', // Change name only in debug mode
}

module.exports = config

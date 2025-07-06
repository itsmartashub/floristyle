const isDebug = true // Toggle debug mode here
const vNumber = '5.1.1'
const changes = 'remove current num row styling and update general num look for different keybooard modes'

// Configuration for builds
const config = {
	isDebug, // Export isDebug for use in build scripts
	VERSION: `${vNumber}${isDebug ? '-debug' : ''}`, // Build version with dynamic `-debug` suffix
	CHANGE_NAME: isDebug ? changes : '', // Change name only in debug mode
}

module.exports = config

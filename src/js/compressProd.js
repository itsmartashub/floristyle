const path = require('path')
const config = require('../config')
const { updateVersionInExtensionJson, compressToFlex } = require('./sharedCompress')

const VERSION = config.VERSION
const BUILD_FOLDER = 'prod' // Hardcoded for production builds

const decompressedDir = path.join(__dirname, '..', 'decompressed')
const outputDir = path.join(__dirname, '..', BUILD_FOLDER)

const outputFileName = `gboardish-v${VERSION}.flex`
const outputFilePath = path.join(outputDir, outputFileName)

;(async () => {
	try {
		updateVersionInExtensionJson(decompressedDir, VERSION)
		compressToFlex(decompressedDir, outputFilePath)
	} catch (err) {
		console.error('Error:', err.message)
	}
})()

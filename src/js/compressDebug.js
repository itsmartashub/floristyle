const path = require('path')
const config = require('../config')
const { updateVersionInExtensionJson, compressToFlex } = require('./sharedCompress')

const VERSION = config.VERSION
const CHANGE_NAME = config.CHANGE_NAME
const BUILD_FOLDER = 'debug' // Hardcoded for debug builds

const decompressedDir = path.join(__dirname, '..', 'decompressed')
const outputDir = path.join(__dirname, '..', BUILD_FOLDER)

const outputFileName = `gboardish-v${VERSION}-${CHANGE_NAME}.flex`
const outputFilePath = path.join(outputDir, outputFileName)

;(async () => {
	try {
		updateVersionInExtensionJson(decompressedDir, VERSION)
		compressToFlex(decompressedDir, outputFilePath)
	} catch (err) {
		console.error('Error:', err.message)
	}
})()

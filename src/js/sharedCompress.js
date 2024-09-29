const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

// Function to update version in extension.json
function updateVersionInExtensionJson(decompressedDir, version) {
	const extensionJsonPath = path.join(decompressedDir, 'extension.json')
	if (!fs.existsSync(extensionJsonPath)) {
		console.error('extension.json file not found in decompressed directory.')
		process.exit(1)
	}

	const extensionJson = JSON.parse(fs.readFileSync(extensionJsonPath, 'utf8'))
	extensionJson.meta.version = version

	fs.writeFileSync(extensionJsonPath, JSON.stringify(extensionJson, null, 2))
	console.log('Updated version in extension.json to:', version)
}

// Function to compress files to .flex format
function compressToFlex(decompressedDir, outputFilePath) {
	try {
		const zip = new AdmZip()
		zip.addLocalFolder(decompressedDir)
		zip.writeZip(outputFilePath)
		console.log(`Recompressed to ${outputFilePath}`)
	} catch (err) {
		console.error('Error compressing to .flex file:', err.message)
		process.exit(1)
	}
}

module.exports = { updateVersionInExtensionJson, compressToFlex }

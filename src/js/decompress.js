require('dotenv').config() // Add this at the top if using .env for environment variables

const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

const inputDir = path.join(__dirname, '..', 'input') // Updated path
const outputDir = path.join(__dirname, '..', 'decompressed') // Updated path

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

// Helper to find the latest flex file
function findLatestFlexFile(directory) {
	try {
		const files = fs.readdirSync(directory).filter((file) => file.endsWith('.flex'))
		if (!files.length) throw new Error('No .flex files found in the directory')

		return files
			.map((file) => ({
				file,
				mtime: fs.statSync(path.join(directory, file)).mtime,
			}))
			.sort((a, b) => b.mtime - a.mtime)[0].file
	} catch (err) {
		console.error('Error finding latest .flex file:', err.message)
		process.exit(1)
	}
}

// Decompress the flex file
function decompressFlexFile(filePath, outputDir) {
	try {
		const zip = new AdmZip(filePath)
		zip.extractAllTo(outputDir, true)
		console.log(`Decompressed ${filePath} to ${outputDir}`)
	} catch (err) {
		console.error('Error decompressing file:', err.message)
		process.exit(1)
	}
}

;(async () => {
	try {
		const latestFlexFile = findLatestFlexFile(inputDir)
		const flexFilePath = path.join(inputDir, latestFlexFile)

		// Decompress
		decompressFlexFile(flexFilePath, outputDir)
	} catch (err) {
		console.error('Error:', err.message)
	}
})()

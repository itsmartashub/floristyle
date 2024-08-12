const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip')

const version = '3.0.1'
const inputFlexFilePath = path.join(__dirname, '../flex_compressed/input', `gboardish-v${version}.flex`)
const outputFolderPath = './src/flex_decompressed'

decompressFlexFile(inputFlexFilePath, outputFolderPath)

console.log({ inputFlexFilePath, outputFolderPath })

function decompressFlexFile(inputFlexFilePath, outputFolderPath) {
	try {
		// Check if the Flex file exists before attempting to decompress
		if (!fs.existsSync(inputFlexFilePath)) throw new Error('Flex file not found.')

		const zip = new AdmZip(inputFlexFilePath)
		zip.extractAllTo(outputFolderPath, true)
		console.log('Flex file decompressed successfully.')
	} catch (err) {
		console.error('Error during decompression:', err.message)
	}
}

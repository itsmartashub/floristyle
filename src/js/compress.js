const path = require('path')
const AdmZip = require('adm-zip')

const { formatCurrTime } = require('./utils')

function compressToFlexFile(inputFolderPath, outputFlexFilePath) {
	const zip = new AdmZip()

	// Get the absolute path of the input folder
	const absoluteInputPath = path.join(__dirname, inputFolderPath)

	// Add the entire directory to the zip
	zip.addLocalFolder(absoluteInputPath)

	// Write the zip file
	zip.writeZip(outputFlexFilePath)
}

let changesName = 'emoji-key code -211 and -7 2 match gboard'
// changesName = changesName.replaceAll(' ', '_')

// const inputFolderPath = 'flex_decompressed'
const inputFolderPath = '../flex_decompressed'
const outputFlexFilePathDev = path.join(
	__dirname,
	'../flex_compressed/dev',
	// `gboardish--${formatCurrTime()}.flex`
	`gboardish--${changesName}.flex`
)
const outputFlexFilePath = path.join(__dirname, 'flex_compressed', 'gboardish.flex')

/* DEV */
compressToFlexFile(inputFolderPath, outputFlexFilePathDev)

/* PRODUCTION */
compressToFlexFile(inputFolderPath, outputFlexFilePath)

console.log({ inputFolderPath, outputFlexFilePath })
console.log('Files compressed back to Flex successfully.')

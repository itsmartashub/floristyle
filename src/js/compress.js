const path = require('path')
const AdmZip = require('adm-zip')

const version = '3.0.2'
const inputFolderPath = '../flex_decompressed'

/* DEBUG */
let changesName = '#12'
changesName = changesName.replaceAll(' ', '_')

const outputFlexFilePathDebug = path.join(
	__dirname,
	'../flex_compressed/🐛 debug',
	`gboardish-v${version}-${changesName}.flex`
)
const outputFlexFilePathProd = path.join(__dirname, '../flex_compressed/🚀 prod', `gboardish-v${version}.flex`)

/* 🐛 DEBUG */
// compressToFlexFile(inputFolderPath, outputFlexFilePathDebug)

/* 🚀 PRODUCTION */
compressToFlexFile(inputFolderPath, outputFlexFilePathProd)
// console.log({ inputFolderPath, outputFlexFilePathProd })

console.log('Files compressed back to Flex successfully.')

/* FUNCTIONS */
function compressToFlexFile(inputFolderPath, outputFlexFilePath) {
	const zip = new AdmZip()

	// Get the absolute path of the input folder
	const absoluteInputPath = path.join(__dirname, inputFolderPath)

	// Add the entire directory to the zip
	zip.addLocalFolder(absoluteInputPath)

	// Write the zip file
	zip.writeZip(outputFlexFilePath)
}

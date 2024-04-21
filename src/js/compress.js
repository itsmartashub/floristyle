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

let changesName = 'rewrite colors due to new surface color shades'
let version = '3.0.0'
changesName = changesName.replaceAll(' ', '_')

// const inputFolderPath = 'flex_decompressed'
const inputFolderPath = '../flex_decompressed'
const outputFlexFilePathDev = path.join(
	__dirname,
	'../flex_compressed/dev',
	// `gboardish--${formatCurrTime()}.flex`
	// `gboardish--${changesName}.flex`
	`gboardish--${formatCurrTime()}--${changesName}.flex`
)
const outputFlexFilePathTest = path.join(
	__dirname,
	'../flex_compressed/test',
	`gboardish-v${version}-${changesName}.flex`
)
const outputFlexFilePathProd = path.join(__dirname, '../flex_compressed/prod', `gboardish-v${version}.flex`)

/* TEST */
compressToFlexFile(inputFolderPath, outputFlexFilePathTest)

/* PRODUCTION */
compressToFlexFile(inputFolderPath, outputFlexFilePathProd)

console.log({ inputFolderPath, outputFlexFilePathProd })
console.log('Files compressed back to Flex successfully.')

// Shared utilities for build scripts
const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

const logInfo = (msg) => console.log(`\x1b[34m[INFO]\x1b[0m ${msg}`)
const logWarn = (msg) => console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`)
const logError = (msg) => console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`)

const removeDirRecursive = async (dirPath) => {
	if (fsSync.existsSync(dirPath)) await fs.rm(dirPath, { recursive: true, force: true })
}

const unzipFlex = async (flexFile, outDir) => {
	await removeDirRecursive(outDir)
	await fs.mkdir(outDir, { recursive: true })

	const zip = new AdmZip(flexFile)

	zip.extractAllTo(outDir, true)
	logInfo(`Decompressed ${flexFile} to ${outDir}`)
}

const updateVersion = async (dir, version) => {
	const extPath = path.join(dir, 'extension.json')

	if (!fsSync.existsSync(extPath)) throw new Error('extension.json not found in ' + dir)

	const ext = JSON.parse(await fs.readFile(extPath, 'utf8'))

	if (!ext.meta) throw new Error('"meta" not found in extension.json in' + dir)

	ext.meta.version = version
	await fs.writeFile(extPath, JSON.stringify(ext, null, 2))

	logInfo(`Updated version in extension.json to: ${version}`)
}

const zipFolder = async (folder, outFile) => {
	const outDir = path.dirname(outFile)

	if (!fsSync.existsSync(outDir)) await fs.mkdir(outDir, { recursive: true })

	const zip = new AdmZip()

	zip.addLocalFolder(folder)
	zip.writeZip(outFile)

	logInfo(`Compressed ${folder} to ${outFile}`)
}

module.exports = { logInfo, logWarn, logError, updateVersion, zipFolder, unzipFlex }

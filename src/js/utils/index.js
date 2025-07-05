// Shared utilities for build scripts
const fs = require('fs').promises
const fsSync = require('fs')
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

module.exports = { logInfo, logWarn, logError, unzipFlex }

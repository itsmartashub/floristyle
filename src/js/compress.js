// Compress src/_output to a .flex file (debug/prod), configurable via CLI/env

const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const { logInfo, logError, updateVersion, zipFolder } = require('./utils')
const config = require('../config')

// Simple arg/env parser
const getArg = (flag) => {
	const arg = process.argv.find((a) => a.startsWith(`--${flag}=`))
	return arg ? arg.split('=')[1] : null
}

const main = async () => {
	try {
		const args = process.argv.slice(2)
		const verbose = args.includes('--verbose')
		const version = config.VERSION
		const isDebug = require('../config').isDebug

		const inputDir = getArg('input') || process.env.INPUT_DIR || path.join(__dirname, '../_output')
		const outDir =
			getArg('outdir') ||
			(isDebug
				? process.env.DEBUG_DIR || path.resolve(__dirname, '../../debug')
				: process.env.BUILD_DIR || path.resolve(__dirname, '../../build'))
		const outFile = isDebug
			? `gboardish-v${version}-${config.CHANGE_NAME || 'debug'}.flex`
			: `gboardish-v${version}.flex`
		const outputFlex = path.join(outDir, outFile)
		const extJson = path.join(inputDir, 'extension.json')

		if (verbose) {
			logInfo(`Input dir: ${inputDir}`)
			logInfo(`Output dir: ${outDir}`)
			logInfo(`Output file: ${outputFlex}`)
		}

		if (!fsSync.existsSync(inputDir)) {
			logError('Input directory does not exist: ' + inputDir)
			logError('Did you forget to run: node src/js/setup.js ?')
			process.exit(1)
		}
		if (!fsSync.existsSync(extJson)) {
			logError('extension.json not found in: ' + inputDir)
			logError('Did you forget to decompress or create extension.json?')
			process.exit(1)
		}

		await updateVersion(inputDir, version)
		await zipFolder(inputDir, outputFlex)
		logInfo(`Compression complete. Output: ${outputFlex}`)

		if (verbose) {
			// Print summary: number of themes and file size
			try {
				const extRaw = await fs.readFile(extJson, 'utf8')
				const ext = JSON.parse(extRaw)
				const numThemes = Array.isArray(ext.themes) ? ext.themes.length : 0
				const stats = await fs.stat(outputFlex)

				logInfo(`Summary: ${numThemes} themes, .flex size ${(stats.size / 1024).toFixed(1)} KB`)
			} catch (e) {
				logError('Failed to print summary: ' + (e && e.message ? e.message : e))
			}
		}
	} catch (err) {
		logError('Failed to compress: ' + (err && err.message ? err.message : err))
		process.exit(1)
	}
}

main()

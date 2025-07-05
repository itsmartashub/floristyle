// Decompress the latest .flex file from src/_input to src/_output (or custom args), configurable via CLI/env

const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const { logInfo, logError, unzipFlex } = require('./utils')

const getArg = (flag) => {
	const arg = process.argv.find((a) => a.startsWith(`--${flag}=`))
	return arg ? arg.split('=')[1] : null
}

// Find the latest .flex file in a directory
const findLatestFlex = async (dir) => {
	if (!fsSync.existsSync(dir)) return null

	const files = (await fs.readdir(dir)).filter((f) => f.endsWith('.flex'))

	if (!files.length) return null

	const stats = await Promise.all(
		files.map(async (f) => ({
			file: f,
			mtime: (await fs.stat(path.join(dir, f))).mtime,
		}))
	)
	return stats.sort((a, b) => b.mtime - a.mtime)[0].file
}

const main = async () => {
	try {
		const [, , inputFlex, outputDir] = process.argv
		const verbose = process.argv.includes('--verbose')
		let inFile = inputFlex
		let outDir = outputDir

		const inputDir = getArg('input') || process.env.INPUT_DIR || path.join(__dirname, '../_input')
		const outputBase = getArg('output') || process.env.OUTPUT_DIR || path.join(__dirname, '../_output')

		if (!inFile || !outDir) {
			const latestFlex = await findLatestFlex(inputDir)

			if (!latestFlex) {
				logError('No .flex file found in ' + inputDir)
				logError('Did you forget to put a .flex file in src/_input?')
				process.exit(1)
			}

			inFile = path.join(inputDir, latestFlex)
			outDir = outputBase

			if (verbose) logInfo(`Auto-selected: ${inFile}`)
		}

		if (verbose) {
			logInfo(`Input .flex: ${inFile}`)
			logInfo(`Output dir: ${outDir}`)
		}

		if (!fsSync.existsSync(inFile) || !inFile.endsWith('.flex')) {
			logError('Input file does not exist or is not a .flex file.')
			logError('Did you specify the correct file?')
			process.exit(1)
		}

		await unzipFlex(inFile, outDir)
		logInfo('Decompression complete.')
	} catch (err) {
		logError('Failed to decompress: ' + (err && err.message ? err.message : err))
		process.exit(1)
	}
}

main()

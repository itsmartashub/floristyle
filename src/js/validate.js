const path = require('path')
const fs = require('fs').promises
// const fsSync = require('fs')
const { logError, logInfo } = require('./utils')

const inputDir = path.join(__dirname, '../_output')
const extJson = path.join(inputDir, 'extension.json')
const stylesheetsDir = path.join(inputDir, 'stylesheets')

// Validation: stylesheets count matches themes count
const checkStylesheetsCount = async () => {
	try {
		const files = (await fs.readdir(stylesheetsDir)).filter((f) => f.endsWith('.json'))
		const fileSet = new Set(files)
		const extRaw = await fs.readFile(extJson, 'utf8')
		const ext = JSON.parse(extRaw)
		const themeIds = Array.isArray(ext.themes) ? ext.themes.map((t) => t.id) : []
		const numThemes = themeIds.length
		const expectedFiles = themeIds.map((id) => `${id}.json`)
		const expectedSet = new Set(expectedFiles)
		const missingFiles = expectedFiles.filter((f) => !fileSet.has(f))
		const extraFiles = files.filter((f) => !expectedSet.has(f))

		if (files.length !== numThemes) {
			logError(`Mismatch: Found ${files.length} stylesheets, but ${numThemes} themes in extension.json.`)

			if (missingFiles.length) {
				logError('Missing stylesheet json files for theme ids:')
				missingFiles.forEach((f) => logError('  ' + f))
			}
			if (extraFiles.length) {
				logError('Stylesheet files with no matching theme.id in extension.json:')
				extraFiles.forEach((f) => logError('  ' + f))
			}

			logError('Each theme must have a corresponding stylesheet file. Validation failed.')
			process.exit(1)
		}
		logInfo('Stylesheet/theme count validation passed.')
	} catch (e) {
		logError('Failed to check stylesheets count: ' + (e && e.message ? e.message : e))
		process.exit(1)
	}
}

;(async () => {
	await checkStylesheetsCount()
	// await otherChecks();
	logInfo('All validation checks passed.')
	process.exit(0)
})()

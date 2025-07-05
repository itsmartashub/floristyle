const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const { logInfo, logWarn, logError } = require('./utils')

const stylesheetsDir = path.join(__dirname, '../_output/stylesheets')
const outputFile = path.join(__dirname, '../../analyze-output.txt')

const getRelevantProps = (obj) => {
	// Return all top-level keys except $schema and @defines
	return Object.keys(obj).filter((k) => k !== '$schema' && k !== '@defines')
}

const pad = (str, len) => str + ' '.repeat(Math.max(0, len - str.length))

const getArg = (flag) => {
	const arg = process.argv.find((a) => a.startsWith(`--${flag}=`))
	return arg ? arg.split('=')[1] : null
}

const analyze = async () => {
	try {
		const outputMode = getArg('output') || 'both' // console, file, both
		const files = (await fs.readdir(stylesheetsDir)).filter((f) => f.endsWith('.json'))
		const allPropsSet = new Set()
		const fileProps = {}
		// First pass: collect all props
		for (const file of files) {
			const filePath = path.join(stylesheetsDir, file)
			const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
			const props = getRelevantProps(data)
			fileProps[file] = new Set(props)
			props.forEach((p) => allPropsSet.add(p))
		}
		const allProps = Array.from(allPropsSet)
		// Count how many files have each prop
		const propCounts = {}
		for (const prop of allProps) {
			propCounts[prop] = files.filter((f) => fileProps[f].has(prop)).length
		}
		// For each file, list missing props
		const missingByFile = {}
		for (const file of files) {
			const missing = allProps.filter((p) => !fileProps[file].has(p))
			if (missing.length) missingByFile[file] = missing
		}
		// For each prop, list files missing it
		const missingFilesByProp = {}
		for (const prop of allProps) {
			const missingFiles = files.filter((f) => !fileProps[f].has(prop))
			if (missingFiles.length) missingFilesByProp[prop] = missingFiles
		}
		// Prepare output
		const maxPropLen = Math.max(...allProps.map((p) => p.length), 8)
		const maxFileLen = Math.max(...files.map((f) => f.length), 8)

		let output = ''
		output += '==============================\n'
		output += ' Theme Stylesheet Prop Analysis\n'
		output += '==============================\n\n'
		output += `Total themes: ${files.length}\nTotal unique props: ${allProps.length}\n\n`
		output += 'Prop presence across themes:\n'
		output += pad('Prop', maxPropLen) + ' | Present in\n'
		output += '-'.repeat(maxPropLen) + '-|------------\n'

		for (const prop of allProps) {
			output += pad(prop, maxPropLen) + ` | ${propCounts[prop]}/${files.length}\n`
		}

		output += '\nFiles missing props:\n'

		if (Object.keys(missingByFile).length === 0) {
			output += '  All files have all props.\n'
		} else {
			output += pad('File', maxFileLen) + ' | Missing Props\n'
			output += '-'.repeat(maxFileLen) + '-|--------------\n'
			for (const file of Object.keys(missingByFile).sort()) {
				output += pad(file, maxFileLen) + ' |' + '\n'
				missingByFile[file].forEach((prop, idx) => {
					output += ' '.repeat(maxFileLen + 3) + `${idx + 1}. ` + prop + '\n'
				})
			}
		}

		output += '\nProps missing in files:\n'

		if (Object.keys(missingFilesByProp).length === 0) {
			output += '  All props are present in all files.\n'
		} else {
			output += pad('Prop', maxPropLen) + ' | Missing in Files\n'
			output += '-'.repeat(maxPropLen) + '-|----------------\n'
			for (const prop of Object.keys(missingFilesByProp).sort()) {
				output += pad(prop, maxPropLen) + ' |' + '\n'
				missingFilesByProp[prop].forEach((file, idx) => {
					output += ' '.repeat(maxPropLen + 3) + `${idx + 1}. ` + file + '\n'
				})
			}
		}

		// Output to console/file/both
		if (outputMode === 'console' || outputMode === 'both') {
			logInfo('\n' + output)
		}
		if (outputMode === 'file' || outputMode === 'both') {
			await fs.writeFile(outputFile, output, 'utf8')
			logInfo(`Analysis written to ${outputFile}`)
		}
	} catch (e) {
		logError('Failed to analyze stylesheets: ' + (e && e.message ? e.message : e))
		process.exit(1)
	}
}

analyze()

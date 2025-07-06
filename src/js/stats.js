const path = require('path')
const fs = require('fs').promises
const { logInfo, logWarn, logError } = require('./utils')

class ThemeAnalyzer {
	constructor() {
		this.stylesheetsDir = path.join(__dirname, '../_output/stylesheets')
		this.outputFile = path.join(__dirname, '../../stats/results.txt')
		this.config = this.parseArgs()
	}

	parseArgs() {
		const args = process.argv.slice(2)
		const config = {
			output: 'both', // console, file, both
			format: 'table', // table, json, csv
			sortBy: 'usage', // usage, name, missing
			threshold: 0, // only show props missing in X+ files
			verbose: false,
		}

		// More efficient arg parsing with destructuring
		for (const arg of args) {
			if (arg.startsWith('--')) {
				const [key, value] = arg.slice(2).split('=')
				if (key in config) {
					config[key] = value === 'true' || (value !== 'false' && value)
				}
			}
		}

		return config
	}

	// Cached regex for better performance
	#relevantPropsRegex = /^[^$@]/

	getRelevantProps(obj) {
		return Object.keys(obj).filter((k) => this.#relevantPropsRegex.test(k))
	}

	async loadThemeData() {
		try {
			const files = (await fs.readdir(this.stylesheetsDir)).filter((f) => f.endsWith('.json')).sort()

			if (!files.length) throw new Error('No JSON theme files found')

			const themes = new Map()
			const results = await Promise.allSettled(
				files.map(async (file) => {
					const filePath = path.join(this.stylesheetsDir, file)
					const data = JSON.parse(await fs.readFile(filePath, 'utf8'))
					return [file, new Set(this.getRelevantProps(data))]
				})
			)

			// Handle results efficiently
			results.forEach((result, idx) => {
				if (result.status === 'fulfilled') {
					const [file, props] = result.value
					themes.set(file, props)
				} else {
					logWarn(`Failed to parse ${files[idx]}: ${result.reason.message}`)
				}
			})

			return themes
		} catch (err) {
			throw new Error(`Failed to load theme data: ${err.message}`)
		}
	}

	analyzeThemes(themes) {
		const files = Array.from(themes.keys())
		const allProps = new Set()

		// Single pass to collect all props
		for (const props of themes.values()) {
			for (const prop of props) {
				allProps.add(prop)
			}
		}

		// Pre-categorize themes once
		const borderlessThemes = files.filter((f) => f.toLowerCase().includes('borderless'))
		const borderedThemes = files.filter((f) => !f.toLowerCase().includes('borderless'))
		const isBorderlessMap = new Map(files.map((f) => [f, f.toLowerCase().includes('borderless')]))

		const propStats = new Map()
		const missingByTheme = new Map()
		const missingByProp = new Map()
		const borderlessAnalysis = new Map()

		// Single mega-efficient pass
		for (const prop of allProps) {
			const presentIn = []
			const missingIn = []
			let borderlessPresent = 0
			let borderedPresent = 0

			for (const file of files) {
				const has = themes.get(file).has(prop)

				if (has) {
					presentIn.push(file)
					isBorderlessMap.get(file) ? borderlessPresent++ : borderedPresent++
				} else {
					missingIn.push(file)
				}
			}

			const presentCount = presentIn.length
			const missingCount = missingIn.length

			propStats.set(prop, {
				presentCount,
				missingCount,
				coverage: ((presentCount / files.length) * 100).toFixed(1),
			})

			const borderlessTotal = borderlessThemes.length
			const borderedTotal = borderedThemes.length

			borderlessAnalysis.set(prop, {
				borderlessPresent,
				borderlessTotal,
				borderlessCoverage: borderlessTotal ? ((borderlessPresent / borderlessTotal) * 100).toFixed(1) : '0.0',
				borderedPresent,
				borderedTotal,
				borderedCoverage: borderedTotal ? ((borderedPresent / borderedTotal) * 100).toFixed(1) : '0.0',
			})

			if (missingCount > 0) {
				missingByProp.set(prop, missingIn)
			}
		}

		// Build missing by theme map
		const allPropsArray = Array.from(allProps)
		for (const [file, themeProps] of themes) {
			const missing = allPropsArray.filter((prop) => !themeProps.has(prop))
			if (missing.length > 0) {
				missingByTheme.set(file, missing)
			}
		}

		return {
			files,
			allProps: allPropsArray,
			propStats,
			missingByTheme,
			missingByProp,
			borderlessAnalysis,
			themeTypes: {
				borderless: borderlessThemes,
				bordered: borderedThemes,
			},
			summary: {
				totalThemes: files.length,
				totalProps: allProps.size,
				fullyConsistentThemes: files.length - missingByTheme.size,
				universalProps: allPropsArray.filter((p) => propStats.get(p).missingCount === 0).length,
				borderlessCount: borderlessThemes.length,
				borderedCount: borderedThemes.length,
				borderlessPercentage: ((borderlessThemes.length / files.length) * 100).toFixed(1),
			},
		}
	}

	// Moved sort logic to separate method for cleaner code
	getSortedProps(allProps, propStats, sortBy) {
		const sortFunctions = {
			usage: (a, b) => propStats.get(b).presentCount - propStats.get(a).presentCount,
			missing: (a, b) => propStats.get(b).missingCount - propStats.get(a).missingCount,
			name: (a, b) => a.localeCompare(b),
		}

		return allProps.sort(sortFunctions[sortBy] || sortFunctions.name)
	}

	formatTableOutput(analysis) {
		const { files, allProps, propStats, missingByTheme, missingByProp, borderlessAnalysis, themeTypes, summary } =
			analysis
		const maxPropLen = Math.max(...allProps.map((p) => p.length), 8)

		const lines = []

		// Header
		lines.push('╔' + '═'.repeat(60) + '╗')
		lines.push('║' + ' Theme Stylesheet Analysis Report'.padEnd(60) + '║')
		lines.push('╚' + '═'.repeat(60) + '╝\n')

		// Summary
		lines.push('📊 SUMMARY', '─'.repeat(40))
		lines.push(`Themes analyzed: ${summary.totalThemes}`)
		lines.push(`Unique properties: ${summary.totalProps}`)
		lines.push(`Fully consistent themes: ${summary.fullyConsistentThemes}`)
		lines.push(`Universal properties: ${summary.universalProps}\n`)

		// Theme breakdown
		lines.push('🎨 THEME TYPE BREAKDOWN', '─'.repeat(40))
		lines.push(`Borderless themes: ${summary.borderlessCount} (${summary.borderlessPercentage}%)`)
		lines.push(`Bordered themes: ${summary.borderedCount} (${(100 - summary.borderlessPercentage).toFixed(1)}%)\n`)

		// Theme lists
		if (themeTypes.borderless.length) {
			lines.push('🔲 Borderless themes:')
			themeTypes.borderless.forEach((theme, idx) => {
				lines.push(`  ${(idx + 1).toString().padStart(2)}. ${theme}`)
			})
			lines.push('')
		}

		if (themeTypes.bordered.length) {
			lines.push('🔳 Bordered themes:')
			themeTypes.bordered.forEach((theme, idx) => {
				lines.push(`  ${(idx + 1).toString().padStart(2)}. ${theme}`)
			})
			lines.push('')
		}

		// Property coverage table
		const sortedProps = this.getSortedProps(allProps, propStats, this.config.sortBy)

		lines.push('🎯 PROPERTY COVERAGE', '─'.repeat(40))
		lines.push(`${'Property'.padEnd(maxPropLen)} │ Overall │ Borderless │ Bordered`)
		lines.push('─'.repeat(maxPropLen) + '─┼─────────┼────────────┼─────────')

		for (const prop of sortedProps) {
			const stats = propStats.get(prop)
			if (stats.missingCount < this.config.threshold) continue

			const borderlessStats = borderlessAnalysis.get(prop)
			const overall = `${stats.coverage}%`.padStart(7)
			const borderless = `${borderlessStats.borderlessCoverage}%`.padStart(10)
			const bordered = `${borderlessStats.borderedCoverage}%`.padStart(8)

			lines.push(`${prop.padEnd(maxPropLen)} │ ${overall} │ ${borderless} │ ${bordered}`)
		}

		// Significant differences
		const significantDiffs = allProps.filter((prop) => {
			const stats = borderlessAnalysis.get(prop)
			return Math.abs(parseFloat(stats.borderlessCoverage) - parseFloat(stats.borderedCoverage)) > 25
		})

		if (significantDiffs.length) {
			lines.push('\n⚡ PROPERTIES WITH SIGNIFICANT THEME TYPE DIFFERENCES (>25%)', '─'.repeat(40))
			significantDiffs.forEach((prop) => {
				const stats = borderlessAnalysis.get(prop)
				const diff = Math.abs(parseFloat(stats.borderlessCoverage) - parseFloat(stats.borderedCoverage))
				lines.push(
					`${prop}: ${stats.borderlessCoverage}% borderless vs ${stats.borderedCoverage}% bordered (${diff.toFixed(
						1
					)}% diff)`
				)
			})
			lines.push('')
		}

		// Missing by theme - GROUPED BY TYPE
		if (missingByTheme.size) {
			lines.push('\n🔍 MISSING PROPERTIES BY THEME', '─'.repeat(40))

			// Group themes by type
			const borderlessMissing = []
			const borderedMissing = []

			for (const [file, missing] of missingByTheme) {
				const entry = { file, missing }
				if (file.toLowerCase().includes('borderless')) {
					borderlessMissing.push(entry)
				} else {
					borderedMissing.push(entry)
				}
			}

			// Sort each group
			borderlessMissing.sort((a, b) => b.missing.length - a.missing.length || a.file.localeCompare(b.file))
			borderedMissing.sort((a, b) => b.missing.length - a.missing.length || a.file.localeCompare(b.file))

			// Display borderless themes
			if (borderlessMissing.length) {
				lines.push(`\n┌─ 🔲 BORDERLESS THEMES (${borderlessMissing.length} with missing properties)`)
				borderlessMissing.forEach(({ file, missing }) => {
					lines.push(`│ ${file} (${missing.length} missing):`)
					missing.forEach((prop, idx) => {
						lines.push(`│   ${(idx + 1).toString().padStart(2)}. ${prop}`)
					})
					lines.push('│')
				})
				lines.push('└─' + '─'.repeat(50))
			}

			// Display bordered themes
			if (borderedMissing.length) {
				lines.push(`\n┌─ 🔳 BORDERED THEMES (${borderedMissing.length} with missing properties)`)
				borderedMissing.forEach(({ file, missing }) => {
					lines.push(`│ ${file} (${missing.length} missing):`)
					missing.forEach((prop, idx) => {
						lines.push(`│   ${(idx + 1).toString().padStart(2)}. ${prop}`)
					})
					lines.push('│')
				})
				lines.push('└─' + '─'.repeat(50))
			}
		}

		// Missing by property - GROUPED BY THEME TYPE
		if (missingByProp.size) {
			lines.push('\n🎯 THEMES MISSING EACH PROPERTY', '─'.repeat(40))

			const sortedMissingProps = [...missingByProp.entries()].sort(([a], [b]) => {
				const sortFunctions = {
					usage: () => missingByProp.get(b).length - missingByProp.get(a).length,
					missing: () => missingByProp.get(b).length - missingByProp.get(a).length,
					name: () => a.localeCompare(b),
				}
				return (sortFunctions[this.config.sortBy] || sortFunctions.name)()
			})

			for (const [prop, missingThemes] of sortedMissingProps) {
				if (missingThemes.length < this.config.threshold) continue

				// Group missing themes by type
				const borderlessMissingThemes = missingThemes.filter((theme) => theme.toLowerCase().includes('borderless'))
				const borderedMissingThemes = missingThemes.filter((theme) => !theme.toLowerCase().includes('borderless'))

				lines.push(`\n┌─ ${prop} (missing in ${missingThemes.length}/${summary.totalThemes} themes)`)

				if (borderlessMissingThemes.length) {
					lines.push(`│ 🔲 Borderless (${borderlessMissingThemes.length}/${themeTypes.borderless.length}):`)
					borderlessMissingThemes.forEach((theme, idx) => {
						lines.push(`│   ${(idx + 1).toString().padStart(2)}. ${theme}`)
					})
					lines.push('│')
				}

				if (borderedMissingThemes.length) {
					lines.push(`│ 🔳 Bordered (${borderedMissingThemes.length}/${themeTypes.bordered.length}):`)
					borderedMissingThemes.forEach((theme, idx) => {
						lines.push(`│   ${(idx + 1).toString().padStart(2)}. ${theme}`)
					})
					lines.push('│')
				}

				lines.push('└─' + '─'.repeat(Math.max(prop.length + 20, 30)))
			}
		}

		// Critical props
		const criticalProps = sortedProps.filter((prop) => propStats.get(prop).missingCount > summary.totalThemes * 0.5)
		if (criticalProps.length) {
			lines.push('\n⚠️  CRITICAL: Properties missing in >50% of themes', '─'.repeat(40))
			criticalProps.forEach((prop) => {
				const stats = propStats.get(prop)
				lines.push(`${prop}: missing in ${stats.missingCount}/${summary.totalThemes} themes`)
			})
			lines.push('')
		}

		return lines.join('\n')
	}

	formatJsonOutput(analysis) {
		return JSON.stringify(
			{
				timestamp: new Date().toISOString(),
				config: this.config,
				summary: analysis.summary,
				themeTypes: analysis.themeTypes,
				properties: Array.from(analysis.propStats.entries()).map(([prop, stats]) => ({
					name: prop,
					...stats,
					borderlessStats: analysis.borderlessAnalysis.get(prop),
				})),
				missingByTheme: Object.fromEntries(analysis.missingByTheme),
				missingByProp: Object.fromEntries(analysis.missingByProp),
			},
			null,
			2
		)
	}

	formatCsvOutput(analysis) {
		const headers = ['Property', 'Present Count', 'Missing Count', 'Coverage']
		const rows = Array.from(analysis.propStats.entries()).map(([prop, stats]) => [
			prop,
			stats.presentCount,
			stats.missingCount,
			`${stats.coverage}%`,
		])

		return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
	}

	async outputResults(analysis) {
		const formatters = {
			json: () => this.formatJsonOutput(analysis),
			csv: () => this.formatCsvOutput(analysis),
			table: () => this.formatTableOutput(analysis),
		}

		const output = (formatters[this.config.format] || formatters.table)()

		if (['console', 'both'].includes(this.config.output)) {
			logInfo(output)
		}

		if (['file', 'both'].includes(this.config.output)) {
			const extensions = { json: '.json', csv: '.csv', table: '.txt' }
			const ext = extensions[this.config.format] || '.txt'
			const outputPath = this.outputFile.replace('.txt', ext)

			await fs.writeFile(outputPath, output, 'utf8')
			logInfo(`📄 Analysis written to ${outputPath}`)
		}
	}

	async run() {
		const startTime = performance.now()

		try {
			logInfo('🚀 Starting theme analysis...')

			const themes = await this.loadThemeData()
			logInfo(`📁 Loaded ${themes.size} theme files`)

			const analysis = this.analyzeThemes(themes)
			logInfo(`🔍 Analyzed ${analysis.summary.totalProps} unique properties`)

			await this.outputResults(analysis)

			const duration = ((performance.now() - startTime) / 1000).toFixed(2)
			logInfo(`✅ Analysis completed in ${duration}s`)
		} catch (error) {
			logError(`❌ Analysis failed: ${error.message}`)
			if (this.config.verbose) {
				logError(error.stack)
			}
			process.exit(1)
		}
	}
}

const analyzer = new ThemeAnalyzer()
analyzer.run()

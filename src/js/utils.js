function currTime() {
	let date = new Date()
	let options = {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		hour24: true,
	}
	return new Intl.DateTimeFormat('sr-RS', options).format(date)
	// console.log(formattedDate)
	// return formattedDate
}
function formatCurrTime() {
	let formattedCurrTime = currTime().replaceAll('. ', '-').replaceAll(':', '-')

	let dateParts = formattedCurrTime.split('-')
	formattedCurrTime = [dateParts[2], dateParts[1], dateParts[0], dateParts[3], dateParts[4], dateParts[5]].join('-')

	return formattedCurrTime
}

// Export only the formatCurrTime function
module.exports = { formatCurrTime }

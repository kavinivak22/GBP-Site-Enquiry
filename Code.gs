const SHEET_ID = "1RjxKGKeA0oU4iaAEKTc23yZfvm3uFvty1D9UQ1iCdy0";

/**
 * Serve the web app HTML content based on route
 * @param {Object} e - Event parameter for URL query strings
 * @returns {HtmlOutput}
 */
function doGet(e) {
  const page = e?.parameter?.page;

  if (page === 'form') {
    return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Guberaan Builders Contact Form')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    return HtmlService.createHtmlOutputFromFile('home')
        .setTitle('Guberaan Builders')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Save submitted form data to Google Sheets
 * @param {string} site - Selected site
 * @param {string} name - Customer name
 * @param {string} phone - Phone number
 * @param {string} product - Interested product
 * @returns {boolean}
 */
function saveData(site, name, phone, product) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    let sheet = spreadsheet.getSheetByName("responses");
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet("responses");
      sheet.appendRow(["Timestamp", "Site", "Customer Name", "Phone Number", "Interested Product"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#E0E0E0");
      sheet.setFrozenRows(1);
    }

    sheet.appendRow([new Date(), site, name, phone, product]);
    Logger.log("Data saved: " + name + ", " + phone);
    return true;
  } catch (error) {
    Logger.log("Error saving data: " + error.toString());
    return false;
  }
}

/**
 * Process form submission
 * @param {Object} formData
 * @returns {Object}
 */
function processForm(formData) {
  try {
    const saved = saveData(formData.site, formData.name, formData.phone, formData.product);
    return saved
      ? { status: 'success', message: 'Data saved successfully!' }
      : { status: 'error', message: 'Failed to save data. Please try again.' };
  } catch (error) {
    return { status: 'error', message: 'An error occurred: ' + error.toString() };
  }
}

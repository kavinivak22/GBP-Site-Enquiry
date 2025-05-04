const SHEET_ID = "1RjxKGKeA0oU4iaAEKTc23yZfvm3uFvty1D9UQ1iCdy0"; 

/**
 * Serve the web app HTML content
 * @returns {HtmlOutput} - HTML content to be displayed
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('Guberaan Builders Contact Form')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Save submitted form data to Google Sheets
 * @param {string} site - Selected site
 * @param {string} name - Customer name
 * @param {string} phone - Phone number
 * @param {string} product - Interested product
 * @returns {boolean} - Success status
 */
function saveData(site, name, phone, product) {
  try {
    // Access the spreadsheet by ID and get the responses sheet
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    // Check if "responses" sheet exists, create it if not
    let sheet = spreadsheet.getSheetByName("responses");
    if (!sheet) {
      sheet = spreadsheet.insertSheet("responses");
      sheet.appendRow(["Timestamp", "Site", "Customer Name", "Phone Number", "Interested Product"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#E0E0E0");
      sheet.setFrozenRows(1);
    }
    
    // Get current date and time
    const timestamp = new Date();
    
    // Append the new row with form data
    sheet.appendRow([timestamp, site, name, phone, product]);
    
    // Log the successful operation
    Logger.log("Data saved successfully: " + name + ", " + phone);
    
    return true;
  } catch (error) {
    // Log any errors that occur
    Logger.log("Error saving data: " + error.toString());
    return false;
  }
}

/**
 * Process form submission
 * This function is called from the client-side via google.script.run
 * @param {Object} formData - Form data object
 * @returns {Object} - Result object with status and message
 */
function processForm(formData) {
  try {
    // Save data to spreadsheet
    const saved = saveData(formData.site, formData.name, formData.phone, formData.product);
    
    if (saved) {
      return {
        status: 'success',
        message: 'Data saved successfully!'
      };
    } else {
      return {
        status: 'error',
        message: 'Failed to save data. Please try again.'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: 'An error occurred: ' + error.toString()
    };
  }
}

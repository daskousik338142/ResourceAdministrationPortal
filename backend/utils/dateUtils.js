/**
 * Utility functions for date conversion
 */

/**
 * Convert Excel serial date to MM/DD/YYYY format
 * @param {number|string} serialDate - Excel serial date number or string
 * @returns {string} - Formatted date as MM/DD/YYYY or empty string if invalid
 */
function convertExcelSerialDate(serialDate) {
  if (!serialDate || serialDate === '' || isNaN(serialDate)) {
    return '';
  }
  
  // Excel serial date starts from January 1, 1900
  // But Excel incorrectly treats 1900 as a leap year, so we need to adjust
  const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
  // Subtract 2 days to account for Excel's leap year bug and 0-indexing
  const adjustedSerial = serialDate - 2;
  const resultDate = new Date(excelEpoch.getTime() + (adjustedSerial * millisecondsPerDay));
  
  // Format as MM/DD/YYYY
  const month = String(resultDate.getMonth() + 1).padStart(2, '0');
  const day = String(resultDate.getDate()).padStart(2, '0');
  const year = resultDate.getFullYear();
  
  return `${month}/${day}/${year}`;
}

/**
 * Convert various date formats to MM/DD/YYYY format
 * @param {number|string|Date} dateValue - Date in various formats
 * @returns {string} - Formatted date as MM/DD/YYYY or empty string if invalid
 */
function formatDateToMMDDYYYY(dateValue) {
  if (!dateValue || dateValue === '') {
    return '';
  }
  
  try {
    let date;
    
    // Handle different date formats
    if (typeof dateValue === 'number') {
      // Treat as Excel serial date
      return convertExcelSerialDate(dateValue);
    } else if (typeof dateValue === 'string') {
      // Try parsing as string
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return '';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }
    
    // Format as MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    return '';
  }
}

/**
 * Common date field names that should be converted
 */
const COMMON_DATE_FIELDS = [
  'Assignment Start Date',
  'Billable/ Release Date(MM/DD/YYYY)',
  'AllocationStartDate',
  'AllocationEndDate',
  'Start Date',
  'End Date',
  'Date',
  'Created Date',
  'Modified Date',
  'Upload Date'
];

/**
 * Check if a field name indicates it contains date values
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if the field likely contains dates
 */
function isDateField(fieldName) {
  if (!fieldName || typeof fieldName !== 'string') {
    return false;
  }
  
  const lowerFieldName = fieldName.toLowerCase();
  
  // Check exact matches
  if (COMMON_DATE_FIELDS.some(field => field.toLowerCase() === lowerFieldName)) {
    return true;
  }
  
  // Check if field name contains date-related keywords
  const dateKeywords = ['date', 'time', 'start', 'end', 'created', 'modified', 'updated'];
  return dateKeywords.some(keyword => lowerFieldName.includes(keyword));
}

/**
 * Convert date fields in a record object
 * @param {Object} record - The record object to process
 * @param {Array<string>} [specificFields] - Optional array of specific field names to convert
 * @returns {Object} - New record object with converted date fields
 */
function convertDateFieldsInRecord(record, specificFields = null) {
  if (!record || typeof record !== 'object') {
    return record;
  }
  
  const convertedRecord = { ...record };
  const fieldsToCheck = specificFields || Object.keys(record);
  
  fieldsToCheck.forEach(fieldName => {
    const fieldValue = convertedRecord[fieldName];
    
    // Skip if field doesn't exist or is already a formatted string
    if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
      return;
    }
    
    // Convert if it's a date field and contains a numeric value
    if ((specificFields || isDateField(fieldName)) && !isNaN(fieldValue)) {
      convertedRecord[fieldName] = formatDateToMMDDYYYY(fieldValue);
    }
  });
  
  return convertedRecord;
}

module.exports = {
  convertExcelSerialDate,
  formatDateToMMDDYYYY,
  isDateField,
  convertDateFieldsInRecord,
  COMMON_DATE_FIELDS
};

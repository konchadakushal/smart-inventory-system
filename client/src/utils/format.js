/**
 * Helper utilities for formatting display values to Indian standards
 */

/**
 * Format a number to Indian Rupees (INR) format (e.g. ₹1,50,000.00)
 * @param {number|string} amount 
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  const value = parseFloat(amount);
  if (isNaN(value)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value);
};

/**
 * Format a date to DD-MM-YYYY format
 * @param {string|Date} dateVal 
 * @returns {string} Formatted date string
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return 'N/A';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return 'N/A';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Format a date/time string to 12-hour AM/PM format
 * @param {string|Date} dateVal 
 * @returns {string} Formatted time string
 */
export const formatTime = (dateVal) => {
  if (!dateVal) return 'N/A';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return 'N/A';
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  
  return `${strHours}:${minutes} ${ampm}`;
};

/**
 * Format a phone number to standard Indian layout +91 XXXXX-XXXXX
 * @param {string} phone 
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  // Strip non-numeric
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  return phone;
};

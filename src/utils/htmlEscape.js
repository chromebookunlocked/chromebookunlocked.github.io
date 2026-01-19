/**
 * HTML Escaping Utility
 * 
 * Escapes HTML special characters to prevent XSS attacks
 * when inserting user-controlled data into HTML templates
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
function escapeHtml(str) {
  if (str == null) return '';
  if (typeof str !== 'string') {
    // Convert to string if not already
    str = String(str);
  }
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;' // or '&apos;' but &#039; is more compatible
  };
  
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Escape HTML attributes (quotes are critical)
 * @param {string} str - String to escape for attribute value
 * @returns {string} Escaped string safe for HTML attributes
 */
function escapeHtmlAttr(str) {
  if (str == null) return '';
  if (typeof str !== 'string') {
    str = String(str);
  }
  
  return escapeHtml(str)
    .replace(/'/g, '&#x27;')  // Use HTML entity for single quote in attributes
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
    .replace(/\t/g, '&#9;');
}

module.exports = {
  escapeHtml,
  escapeHtmlAttr
};

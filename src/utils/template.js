/**
 * Template processing utilities
 * Handles rendering of email templates with variables
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

/**
 * Compile template with variables
 * @param {string} template - HTML template string
 * @param {Object} variables - Template variables
 * @returns {string} - Compiled HTML
 */
const compileTemplate = (template, variables = {}) => {
  // Add current year to all templates
  const vars = {
    currentYear: new Date().getFullYear(),
    ...variables
  };
  
  // Replace variables in the format {{variableName}}
  return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    varName = varName.trim();
    return typeof vars[varName] !== 'undefined' ? vars[varName] : match;
  });
};

/**
 * Load template from file
 * @param {string} templatePath - Path to template file
 * @returns {Promise<string>} - Template content
 */
const loadTemplate = async (templatePath) => {
  try {
    return await readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load template: ${error.message}`);
  }
};

/**
 * Render template with variables
 * @param {string} templatePath - Path to template file
 * @param {Object} variables - Template variables
 * @returns {Promise<string>} - Rendered template
 */
const renderTemplate = async (templatePath, variables = {}) => {
  const template = await loadTemplate(templatePath);
  return compileTemplate(template, variables);
};

module.exports = {
  compileTemplate,
  loadTemplate,
  renderTemplate
}; 
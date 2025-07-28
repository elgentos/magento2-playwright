#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Check if locale argument is provided
if (process.argv.length < 3) {
  console.error('Please provide a locale argument (e.g., nl_NL)');
  process.exit(1);
}

const locale = process.argv[2];

// Function to find CSV files recursively
function findCsvFiles(dir, locale) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findCsvFiles(filePath, locale));
    } else if (file === `${locale}.csv`) {
      results.push(filePath);
    }
  }

  return results;
}

function parseCsvFile(filePath) {
  const relativeFilePath = filePath.replace('../../../../../../../', '');
  console.log("Translating file: ", relativeFilePath);

  const content = fs.readFileSync(filePath, 'utf-8');
  const records = csv.parse(content, {
    skip_empty_lines: true,
    trim: true
  });

  const translations = {};
  for (const [key, value] of records) {
    translations[key] = value;
  }

  console.log("Done...");

  return translations;
}

// Function to merge translations with precedence
function mergeTranslations(appTranslations, vendorTranslations) {
  return { ...vendorTranslations, ...appTranslations };
}

// Function to translate values in an object recursively
function translateObject(obj, translations) {
  if (typeof obj === 'string') {
    return translations[obj] || obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => translateObject(item, translations));
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = translateObject(value, translations);
    }
    return result;
  }

  return obj;
}

// Main execution
try {
  // Find and parse CSV files
  const appCsvFiles = findCsvFiles('../../../../../../../app', locale);
  const vendorCsvFiles = findCsvFiles('../../../../../../../vendor', locale);

  let appTranslations = {};
  let vendorTranslations = {};

  // Parse app translations
  for (const file of appCsvFiles) {
    const translations = parseCsvFile(file);
    appTranslations = { ...appTranslations, ...translations };
  }

  // Parse vendor translations
  for (const file of vendorCsvFiles) {
    const translations = parseCsvFile(file);
    vendorTranslations = { ...vendorTranslations, ...translations };
  }

  // Merge translations with app taking precedence
  const translations = mergeTranslations(appTranslations, vendorTranslations);

  // Process JSON files
  const jsonFiles = [
    'element-identifiers.json',
    'outcome-markers.json'
  ];

  for (const fileName of jsonFiles) {
    const sourcePath = path.resolve('base-tests/config', fileName);
    const destPath = path.resolve('tests/config', fileName);

    const content = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
    const translatedContent = translateObject(content, translations);

    // Ensure target directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    fs.writeFileSync(destPath, JSON.stringify(translatedContent, null, 2));
    console.log(`Translated file written: ${destPath}`);
  }

  console.log('Translation completed successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
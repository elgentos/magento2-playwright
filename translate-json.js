#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Check if locale argument is provided
if (process.argv.length < 3) {
  console.error('Please provide a locale argument (e.g., nl_NL)');
  process.exit(1);
}

class TranslateJson {

  pathToBaseDir = '../../../../../../../'; // default: when installed via npm (magento2 root folder)
  locale = 'en_US';

  constructor() {
    const isLocalDev = fs.existsSync(path.resolve(__dirname, '.git'));

    if (isLocalDev) {
      this.pathToBaseDir = './'; // we're in the root of the dev repo
    }

    this.locale = process.argv[2];
  }

  main() {
    // Main execution
    try {
      // Find and parse CSV files
      const appCsvFiles = this.findCsvFiles(this.pathToBaseDir  + 'app', this.locale);
      const vendorCsvFiles = this.findCsvFiles(this.pathToBaseDir  + 'vendor', this.locale);

      let appTranslations = {};
      let vendorTranslations = {};

      // Parse app translations
      for (const file of appCsvFiles) {
        const translations = this.parseCsvFile(file);
        appTranslations = { ...appTranslations, ...translations };
      }

      // Parse vendor translations
      for (const file of vendorCsvFiles) {
        try {
          const translations = this.parseCsvFile(file);
          vendorTranslations = { ...vendorTranslations, ...translations };
        } catch (error) {
          console.error(`Error processing vendor file ${file}:`, error.message);
          continue;
        }
      }

      // Merge translations with app taking precedence
      const translations = this.mergeTranslations(appTranslations, vendorTranslations);

      // Process JSON files
      const jsonFiles = [
        'element-identifiers.json',
        'outcome-markers.json'
      ];

      for (const fileName of jsonFiles) {
        const sourcePath = path.resolve('base-tests/config', fileName);
        const destPath = path.resolve('tests/config', fileName);

        const content = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));
        let translatedContent = this.translateObject(content, translations);

        // Read existing translations if the file exists
        if (fs.existsSync(destPath)) {
          const existingContent = JSON.parse(fs.readFileSync(destPath, 'utf-8'));

          // Combine existing and new translations, preserving existing ones
          translatedContent = this.mergeTranslations(translatedContent, existingContent);
        }

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
  }

// Function to find CSV files recursively
  findCsvFiles(dir, locale) {
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

  parseCsvFile(filePath) {
    const relativeFilePath = filePath.replace('../../../../../../../', '');
    console.log("Translating file: ", relativeFilePath);

    const content = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(content, {
      skip_empty_lines: true,
      trim: true
    });

    const translations = {};
    for (const [index, record] of records.entries()) {
      const [key, value] = record;
      translations[key] = value;
    }

    console.log("Done...");

    return translations;
  }

// Function to deeply merge translations with specified precedence
  mergeTranslations(primaryTranslations, secondaryTranslations) {
    const result = { ...secondaryTranslations };

    for (const [key, value] of Object.entries(primaryTranslations)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = mergeTranslations(value, result[key] || {});
      } else {
        if (!result.hasOwnProperty(key)) {
          result[key] = value;
        }
      }
    }

    return result;
  }

// Function to translate values in an object recursively
  translateObject(obj, translations) {
    if (typeof obj === 'string') {
      const translatedValue = translations[obj];
      return translatedValue !== undefined ? translatedValue : null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => translateObject(item, translations)).filter(item => item !== null);
    }

    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const translatedValue = translateObject(value, translations);
        if (translatedValue !== null) {
          result[key] = translatedValue;
        }
      }
      return result;
    }

    return null;
  }
}


const $translateJson = new TranslateJson();
$translateJson.main();
const fs = require('fs');

// destination will be created or overwritten by default.
fs.copyFile('./playwright.config.example.ts', '../playwright.config.ts', (err) => {
  if (err) throw err;
  console.log('File was copied to destination');
});
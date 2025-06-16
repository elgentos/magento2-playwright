const fs = require('fs');

// destination will be created or overwritten by default.
fs.copyFile('./test.example.ts', '../test.ts', (err) => {
  if (err) throw err;
  console.log('File was copied to destination');
});

console.log("Hello world");
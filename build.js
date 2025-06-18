const fs = require('fs');
const path = require('path');

function copyExampleFiles() {
  // const exampleFiles = new Set<string>();
  const exampleFiles = new Set(fs.readdirSync(__dirname).filter(file => file.includes('.example')));

  for (const file of exampleFiles) {
    // destination will be created or overwritten by default.
    const newFileName = file.replace('.example','');
    fs.copyFile('./' + file, '../../../' + newFileName, (err) => {
      if (err) throw err;
      console.log(newFileName + ' was copied to destination');
    });
  }
}

function copyBaseTestsToBaseTestTemp() {

  const sourceDir = path.resolve(__dirname, 'tests');
  const targetDir = path.resolve(__dirname, '../../../base-tests');

  try {
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // Recursief kopiëren
    fs.cpSync(sourceDir, targetDir, { recursive: true });
    console.log(`Copied tests from ${sourceDir} to ${targetDir}`);
  } catch (err) {
    console.error('Error copying test directory:', err);
  }
}

copyExampleFiles();
copyBaseTestsToBaseTestTemp();
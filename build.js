const fs = require('fs');

function copyExampleFiles() {
  // const exampleFiles = new Set<string>();
  const exampleFiles = new Set(fs.readdirSync(__dirname).filter(file => file.includes('.example')));

  for (const file of exampleFiles) {
    // destination will be created or overwritten by default.
    const newFileName = file.replace('.example','');
    fs.copyFile('./' + file, '../../' + newFileName, (err) => {
      if (err) throw err;
      console.log(newFileName + ' was copied to destination');
    });
  }
};

copyExampleFiles();

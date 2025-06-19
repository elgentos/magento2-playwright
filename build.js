const fs = require('fs');
const path = require('path');

class Build {

  tempDirTests = 'base-tests';
  exampleFileName = '.example';

  constructor() {
    this.copyExampleFiles();
    this.copyTestsToTempFolder();
  }

  /**
   * @feature Copy config example files
   * @scenario Copy all `.example` files from the current directory to the root directory.
   * @given I have `.example` files in this directory
   * @when I run the Build script
   * @then The `.example` files should be copied to the root directory without the `.example` extension
   *  @and Existing destination files should NOT be overwritten, but skipped
   */
  copyExampleFiles() {
    // const exampleFiles = new Set<string>();
    const exampleFiles = new Set(fs.readdirSync(__dirname).filter(file => file.includes(this.exampleFileName)));

    for (const file of exampleFiles) {
      // destination will be created or overwritten by default.
      const sourceFile = './' + file;
      const destFile = '../../../' + file.replace(this.exampleFileName,'');

      try {
        fs.copyFileSync(sourceFile, destFile, fs.constants.COPYFILE_EXCL);
        console.log(`${path.basename(destFile)} was copied to destination`);
      } catch (err) {
        if (err.code === 'EEXIST') {
          console.log(`${path.basename(destFile)} already exists, skipping copy.`);
        } else {
          throw err;
        }
      }
    }
  }

  /**
   * @feature Copy base test files
   * @scenario Prepare test suite by copying `tests/` to the root-level `base-tests/` folder.
   * @given There is a `tests/` folder in the package directory
   * @when I run the Build script
   *  @and A `base-tests/` folder already exists in the root
   * @then The existing `base-tests/` folder should be removed
   *  @and A fresh copy of `tests/` should be placed in `../../../base-tests`
   */
  copyTestsToTempFolder() {

    const sourceDir = path.resolve(__dirname, 'tests');
    const targetDir = path.resolve(__dirname, `../../../${this.tempDirTests}`);

    try {
      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      fs.cpSync(sourceDir, targetDir, { recursive: true });
      console.log(`Copied tests from ${sourceDir} to ${targetDir}`);
    } catch (err) {
      console.error('Error copying test directory:', err);
    }
  }
}

new Build();
// @ts-check

import fs from 'fs';
import path from 'path';

function deepMerge(target: any, source: any): any {
  for (const key in source) {
	if (source[key] instanceof Object && key in target) {
	  Object.assign(source[key], deepMerge(target[key], source[key]));
	}
  }
  // Combine the two objects
  return { ...target, ...source };
}

/**
 * Both config layers sit exactly two levels below the project root:
 *   <root>/base-tests/config  - defaults, regenerated from the package on install
 *   <root>/tests/config       - store overrides
 * Deriving the root from __dirname keeps the layers fixed no matter which of the
 * two the @config alias resolved this module from, so the fallback merge holds
 * whether or not a store keeps its own copy of this file.
 */
const projectRoot = path.resolve(__dirname, '../..');
const fallbackDir = path.join(projectRoot, 'base-tests', 'config');
const overrideDir = path.join(projectRoot, 'tests', 'config');

function readConfigFile(dirPath: string, fileName: string) {
  const filePath = path.join(dirPath, fileName);

  if (!fs.existsSync(filePath)) {
	return {};
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function loadAndMergeConfig(fileName: string) {
  const fallbackConfig = readConfigFile(fallbackDir, fileName);
  const currentConfig = readConfigFile(overrideDir, fileName);

  // Use deepMerge instead of shallow merge
  return deepMerge(fallbackConfig, currentConfig);
}

export const UIReference = loadAndMergeConfig('element-identifiers.json');
export const outcomeMarker = loadAndMergeConfig('outcome-markers.json');
export const inputValues = loadAndMergeConfig('input-values.json');
export const slugs = loadAndMergeConfig('slugs.json');
export const toggles = loadAndMergeConfig('test-toggles.json');

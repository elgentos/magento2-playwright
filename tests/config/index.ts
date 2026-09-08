// @ts-check

import fs from 'fs';
import merge from 'lodash.merge';
import path from 'path';

function loadAndMergeConfig(fileName: string): Record<string, any> {
	const fallbackPath = path.resolve(__dirname, fileName);
	const currentPath = path.resolve(__dirname, '../../tests/config/', fileName);

	let currentConfig = {};
	let fallbackConfig = {};

	if (fs.existsSync(currentPath)) {
		currentConfig = JSON.parse(fs.readFileSync(currentPath, 'utf-8'));
	}

	if (fs.existsSync(fallbackPath)) {
		fallbackConfig = JSON.parse(fs.readFileSync(fallbackPath, 'utf-8'));
	}

	return merge({}, fallbackConfig, currentConfig);
}

export const UIReference = loadAndMergeConfig('element-identifiers.json');
export const outcomeMarker = loadAndMergeConfig('outcome-markers.json');
export const inputValues = loadAndMergeConfig('input-values.json');
export const slugs = loadAndMergeConfig('slugs.json');
export const toggles = loadAndMergeConfig('test-toggles.json');

// @ts-check

import fs from 'fs';
import path from 'path';

const basePath = path.resolve('./base-tests/config');
const overridePath = path.resolve('./tests/config');

function loadConfig(filename: string) {
    const overrideFile = path.join(overridePath, filename);
    const baseFile = path.join(basePath, filename);

    if (fs.existsSync(overrideFile)) {
        return require(overrideFile);
    } else {
        if (! process.env.CI) {
            return require(baseFile);
        }
    }
}

const UIReference = loadConfig('element-identifiers.json');
const outcomeMarker = loadConfig('outcome-markers.json');
const slugs = loadConfig('slugs.json');
const inputValues = loadConfig('input-values.json');
const toggles = loadConfig('test-toggles.json');

export { UIReference, outcomeMarker, slugs, inputValues, toggles };
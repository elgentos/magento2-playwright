// @ts-check

import fs from 'fs';
import path from 'path';

function loadConfig(filename: string) {
    const overrideFile = path.join(path.resolve('./tests/config'), filename);

    if (fs.existsSync(overrideFile)) {
        return import(overrideFile);
    }

    if (process.env.CI !== 'true') {
        const baseFile = path.join(path.resolve('./base-tests/config'), filename);
        if (fs.existsSync(baseFile)) {
            return import(baseFile);
        }
    }
}

const UIReference = loadConfig('element-identifiers.json');
const outcomeMarker = loadConfig('outcome-markers.json');
const slugs = loadConfig('slugs.json');
const inputValues = loadConfig('input-values.json');
const toggles = loadConfig('test-toggles.json');

export { UIReference, outcomeMarker, slugs, inputValues, toggles };
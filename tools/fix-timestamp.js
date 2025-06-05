// fix-timestamp-alias.js

/**
 * Script to automatically fix generated code from stephenh-ts-proto:v2.6.1
 * when it incorrectly uses the `Timestamp` alias instead of your custom `Timestamp1` alias.
 *
 * Specifically, it searches for:
 *    fromTimestamp(Timestamp.fromJSON(o))
 * and replaces it with:
 *    fromTimestamp(Timestamp1.fromJSON(o))
 *
 * This helps avoid runtime errors when you're using a renamed import
 * like `import { Timestamp as Timestamp1 } from "..."`
 * but ts-proto still generates code referencing the original `Timestamp`.
 */

const fs = require("fs");
const path = require("path");

const DIR = "../shared/generated/nodejs/src/common/types.ts";

/**
 * Replaces incorrect Timestamp usage in a single file
 * @param {string} filePath - Full path to the file
 */
function fixFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");

    const replaced = content.replace(
        /fromTimestamp\(Timestamp\.fromJSON\(o\)\)/g,
        "fromTimestamp(Timestamp1.fromJSON(o))"
    );

    if (replaced !== content) {
        fs.writeFileSync(filePath, replaced, "utf8");
        console.log(`Fixed Timestamp reference in: ${filePath}`);
    }
}

fixFile(DIR);

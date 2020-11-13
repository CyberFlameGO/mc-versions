"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePage = exports.Edition = void 0;
const node_html_parser_1 = require("node-html-parser");
const util_1 = require("./util");
// Normalization
// The wiki version names are a bit inconsistent.
// Apply replacements in order of declaration (generally by specificity).
const versionNameReplacements = new Map([
    // Java
    [' ;)', ''],
    ['Alpha server', 'Alpha'],
    ['Classic server', 'Classic'],
    // Bedrock/Pocket edition
    ['Pocket Edition ', ''],
    // General
    [/v(\d+\.)/g, '$1'],
    ['Snapshot ', ''],
    [' Release Candidate ', '-rc'],
    [' Pre-release ', '-pre'],
    [' Prerelease', '-pre'],
    // Capitalization
    ['beta ', 'Beta '],
    ['alpha ', 'Alpha ']
]);
function cleanVersionName(dirty, edition) {
    let result = dirty;
    for (const [search, replace] of versionNameReplacements) {
        result = result.replace(search, replace);
    }
    // Remove edition prefix
    result = result.replace(edition.name, '');
    return result.trim();
}
// The April Fools' version had 3 different proto numbers
const JAVA_2_0_RAW_PROTO_NUMBER = 'Blue: 90Red: 91Purple: 92';
const JAVA_2_0_PROTO_NUMBER = 90;
function parseVersionNumber(value) {
    if (value === 'Unknown' || value === 'N/A' || value === 'Pending') {
        return null;
    }
    if (value === JAVA_2_0_RAW_PROTO_NUMBER) {
        return JAVA_2_0_PROTO_NUMBER;
    }
    const number = parseInt(value);
    if (isNaN(number)) {
        console.log(`"${value}"`);
        throw new Error(`Cannot parse version number ${value}`);
    }
    return number;
}
class Edition {
    constructor(id, sections, name = sections[0]) {
        this.id = id;
        this.sections = sections;
        this.name = name;
    }
}
exports.Edition = Edition;
class EditionImpl extends Edition {
    parseRow(cells) {
        return {
            name: cleanVersionName(cells[0], this),
            protocolNumber: parseVersionNumber(cells[1].trim())
        };
    }
}
class JavaEdition extends Edition {
    constructor() {
        super('java', [
            'Java Edition',
            'Java Edition (pre-netty rewrite)',
            'April Fools versions'
        ]);
    }
    parseRow(cells) {
        const dataNumberCell = cells[2];
        const dataNumber = dataNumberCell
            ? parseVersionNumber(dataNumberCell.trim())
            : null;
        return {
            name: cleanVersionName(cells[0], this),
            protocolNumber: parseVersionNumber(cells[1].trim()),
            dataNumber
        };
    }
}
function parseVersions(table, edition) {
    util_1.resolveTableSpans(table);
    const rows = table
        .querySelectorAll('tr')
        // Wiki tables incorrectly use a row in tbody for the header, skip it
        .slice(1)
        .map((row) => row.querySelectorAll('td').map((cell) => cell.innerText));
    return rows.map((row) => edition.parseRow(row));
}
function findSectionTableFor(title, edition) {
    let element = title;
    while ((element = element.nextElementSibling) !== undefined &&
        element.tagName.toLowerCase() !== 'table')
        ;
    if (element === undefined) {
        throw new Error(`Missing table element for ${edition.id}`);
    }
    return element;
}
const editions = new Set([
    new JavaEdition(),
    new EditionImpl('bedrock', ['Bedrock Edition']),
    new EditionImpl('education', ['Education Edition'])
]);
const SECTION_TITLE_SELECTOR = 'h3';
function parsePage(document) {
    const root = node_html_parser_1.parse(document);
    // Map section titles to editions
    const titleElements = new Map();
    root.querySelectorAll(SECTION_TITLE_SELECTOR).forEach((element) => {
        const title = element.innerText;
        for (const edition of editions) {
            if (edition.sections.includes(title)) {
                titleElements.set(element, edition);
                return;
            }
        }
    });
    const result = new Map();
    for (const [title, edition] of titleElements) {
        const table = findSectionTableFor(title, edition);
        const versions = parseVersions(table, edition);
        util_1.pushToMapValue(result, edition, versions);
    }
    return result;
}
exports.parsePage = parsePage;

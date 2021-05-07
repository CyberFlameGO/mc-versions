"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeJsonFile = exports.readJsonFile = exports.pushToMapValue = exports.resolveTableSpans = void 0;
const fs_1 = require("fs");
const node_html_parser_1 = require("node-html-parser");
// DOM
/**
 * Performs a deep clone of the given element.
 * Does not append the copy to the given parent element,
 * but sets its `parentNode` property to that value.
 *
 * @param element the element to clone
 * @param newParent the parent of the cloned element
 */
function clone(element, newParent) {
    const attributes = element.rawAttributes;
    const rawAttributes = Object.keys(attributes)
        .map((name) => {
        const val = attributes[name];
        if (val === 'null' || val === '""') {
            return name;
        }
        return `${name}=${JSON.stringify(String(val))}`;
    })
        .join(' ');
    const result = new node_html_parser_1.HTMLElement(element.tagName, { id: element.id, class: element.classNames }, rawAttributes, newParent);
    const children = element.childNodes.map((child) => {
        if (child instanceof node_html_parser_1.HTMLElement) {
            return clone(child, null);
        }
        return child;
    });
    result.set_content(children); // sets the parentNode of children
    if (newParent !== null) {
        result.parentNode = newParent;
    }
    return result;
}
function getChildIndex(element) {
    const parent = element.parentNode;
    return parent.childNodes.indexOf(element);
}
const ROW_SPAN_ATTR = 'rowspan';
/**
 * Resolves the row spans within the given table.
 * Appends a copy of the `td` elements with the `ROW_SPAN_ATTR`
 * attribute in the corresponding positions.
 * Mainly intended to ease parsing.
 *
 * @param table the table element to apply the transformations on
 */
function resolveTableSpans(table) {
    const spanningCells = table
        .querySelectorAll('td')
        .filter((cell) => cell.hasAttribute(ROW_SPAN_ATTR));
    for (const cell of spanningCells) {
        const span = parseInt(cell.getAttribute(ROW_SPAN_ATTR));
        if (isNaN(span)) {
            throw new Error(`Invalid ${ROW_SPAN_ATTR} atribute value in ${cell}`);
        }
        cell.removeAttribute(ROW_SPAN_ATTR); // resolved
        const columnIndex = getChildIndex(cell);
        let row = cell.parentNode;
        for (let i = 1; 
        // TODO Remove cast (https://github.com/taoqf/node-html-parser/pull/118)
        (row = row.nextElementSibling) !== null && i < span; i++) {
            const newCell = clone(cell, row);
            row.childNodes.splice(columnIndex, 0, newCell);
        }
    }
}
exports.resolveTableSpans = resolveTableSpans;
// Maps
function pushToMapValue(map, key, newElements) {
    const previous = map.get(key);
    if (previous) {
        previous.push(...newElements);
    }
    else {
        map.set(key, newElements);
    }
}
exports.pushToMapValue = pushToMapValue;
// JSON files
async function readJsonFile(filePath) {
    const contents = await fs_1.promises.readFile(filePath, 'utf8');
    return JSON.parse(contents);
}
exports.readJsonFile = readJsonFile;
async function writeJsonFile(filePath, contents) {
    // A line is terminated by a newline character on POSIX-compliant systems.
    const toWrite = `${JSON.stringify(contents)}\n`;
    await fs_1.promises.writeFile(filePath, toWrite, 'utf8');
}
exports.writeJsonFile = writeJsonFile;

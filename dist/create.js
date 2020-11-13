"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const node_fetch_1 = __importDefault(require("node-fetch"));
const parse_1 = require("./parse");
// Utilities
async function readJsonFile(filePath) {
    const contents = await fs_1.promises.readFile(filePath, 'utf8');
    return JSON.parse(contents);
}
async function writeJsonFile(filePath, contents) {
    const toWrite = JSON.stringify(contents);
    await fs_1.promises.writeFile(filePath, toWrite, 'utf8');
}
// Fetching
const VERSIONS_URL = 'https://minecraft.gamepedia.com/api.php?action=parse&page=Template:Protocol_version/Table&prop=text&format=json';
async function getUserAgent() {
    const pkg = await readJsonFile('package.json');
    // Follow generic format in https://meta.wikimedia.org/wiki/User-Agent_policy
    return `${pkg.name}/${pkg.version} (${pkg.repository.url}; ${pkg.author.email})`;
}
async function fetchPage() {
    const userAgent = await getUserAgent();
    const res = await node_fetch_1.default(VERSIONS_URL, {
        headers: {
            'User-Agent': userAgent
        }
    });
    const data = await res.json();
    // https://www.mediawiki.org/wiki/API:Parsing_wikitext
    return data.parse.text['*'];
}
function serialize(editions) {
    const result = {};
    for (const [edition, versions] of editions) {
        result[edition.id] = {
            name: edition.name,
            versions
        };
    }
    return { editions: result };
}
async function create() {
    const document = await fetchPage();
    const editions = parse_1.parsePage(document);
    await writeJsonFile('versions.json', serialize(editions));
}
create();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const util_1 = require("./util");
const parse_1 = require("./parse");
// Fetching
const VERSIONS_URL = 'https://minecraft.gamepedia.com/api.php?action=parse&page=Template:Protocol_version/Table&prop=text&format=json';
async function getUserAgent() {
    const pkg = await util_1.readJsonFile('package.json');
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
    await util_1.writeJsonFile('versions.json', serialize(editions));
}
create();

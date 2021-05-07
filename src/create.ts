import fetch from 'node-fetch';

import { readJsonFile, writeJsonFile } from './util';
import { Edition, Version, parsePage } from './parse';

// Fetching

const VERSIONS_URL =
  'https://minecraft.gamepedia.com/api.php?action=parse&page=Template:Protocol_version/Table&prop=text&format=json';

async function getUserAgent() {
  const pkg = await readJsonFile('package.json');
  // Follow generic format in https://meta.wikimedia.org/wiki/User-Agent_policy
  return `${pkg.name}/${pkg.version} (${pkg.repository.url}; ${pkg.author.email})`;
}

async function fetchPage() {
  const userAgent = await getUserAgent();
  const res = await fetch(VERSIONS_URL, {
    headers: {
      'User-Agent': userAgent
    }
  });
  const data = await res.json();
  // https://www.mediawiki.org/wiki/API:Parsing_wikitext
  return data.parse.text['*'];
}

type SerializedEdition = {
  name: string;
  versions: Version[];
};

function serialize(editions: Map<Edition<Version>, Version[]>): object {
  const result: Record<string, SerializedEdition> = {};
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
  const editions = parsePage(document);

  await writeJsonFile('versions.json', serialize(editions));
}

create();

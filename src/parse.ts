import { HTMLElement, parse } from 'node-html-parser';

import { resolveTableSpans, pushToMapValue } from './util';

// Normalization

// The wiki version names are a bit inconsistent.
// Apply replacements in order of declaration (generally by specificity).

const versionNameReplacements = new Map<RegExp | string, string>([
  // Java
  [' ;)', ''], // Beta 1.8-pre2
  ['Alpha server', 'Alpha'],
  ['Classic server', 'Classic'],
  // Bedrock/Pocket edition
  ['Pocket Edition ', ''],
  // General
  [/v(\d+\.)/g, '$1'], // remove v prefix
  ['Snapshot ', ''],
  [' Release Candidate ', '-rc'],
  [' Pre-release ', '-pre'],
  [' Prerelease', '-pre'],
  // Capitalization
  ['beta ', 'Beta '],
  ['alpha ', 'Alpha ']
]);

function cleanVersionName(dirty: string, edition: Edition) {
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

function parseVersionNumber(value: string): number | null {
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

// Parsing

export interface Version {
  name: string;
  protocolNumber: number | null;
}

type JavaVersion = Version & {
  dataNumber: number | null;
};

export abstract class Edition<V extends Version = Version> {
  constructor(
    readonly id: string,
    readonly sections: string[],
    readonly name: string = sections[0]
  ) {}

  abstract parseRow(cells: string[]): V;
}

class EditionImpl extends Edition {
  parseRow(cells: string[]): Version {
    return {
      name: cleanVersionName(cells[0], this),
      protocolNumber: parseVersionNumber(cells[1].trim())
    };
  }
}

class JavaEdition extends Edition<JavaVersion> {
  constructor() {
    super('java', [
      'Java Edition',
      'Java Edition (pre-netty rewrite)',
      'April Fools versions'
    ]);
  }

  parseRow(cells: string[]): JavaVersion {
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

function parseVersions<V extends Version>(
  table: HTMLElement,
  edition: Edition<V>
): V[] {
  resolveTableSpans(table);
  const rows = table
    .querySelectorAll('tr')
    // Wiki tables incorrectly use a row in tbody for the header, skip it
    .slice(1)
    .map((row) => row.querySelectorAll('td').map((cell) => cell.innerText));

  return rows.map((row) => edition.parseRow(row));
}

function findSectionTableFor(title: HTMLElement, edition: Edition) {
  let element = title;
  while (
    (element = element.nextElementSibling) !== undefined &&
    element.tagName.toLowerCase() !== 'table'
  );

  if (element === undefined) {
    throw new Error(`Missing table element for ${edition.id}`);
  }
  return element;
}

const editions = new Set<Edition>([
  new JavaEdition(),
  new EditionImpl('bedrock', ['Bedrock Edition']),
  new EditionImpl('education', ['Education Edition'])
]);

const SECTION_TITLE_SELECTOR = 'h3';

export function parsePage(document: string): Map<Edition, Version[]> {
  const root = parse(document);

  // Map section titles to editions
  const titleElements = new Map<HTMLElement, Edition>();
  root.querySelectorAll(SECTION_TITLE_SELECTOR).forEach((element) => {
    const title = element.innerText;
    for (const edition of editions) {
      if (edition.sections.includes(title)) {
        titleElements.set(element, edition);
        return;
      }
    }
  });

  const result = new Map<Edition, Version[]>();
  for (const [title, edition] of titleElements) {
    const table = findSectionTableFor(title, edition);
    const versions = parseVersions(table, edition);
    pushToMapValue(result, edition, versions);
  }

  return result;
}

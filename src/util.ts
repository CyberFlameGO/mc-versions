import { promises as fs } from 'fs';
import { HTMLElement } from 'node-html-parser';

// DOM

/**
 * Performs a deep clone of the given element.
 * Does not append the copy to the given parent element,
 * but sets its `parentNode` property to that value.
 *
 * @param element the element to clone
 * @param newParent the parent of the cloned element
 */
function clone(
  element: HTMLElement,
  newParent: HTMLElement | undefined
): HTMLElement {
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

  const result = new HTMLElement(
    element.tagName,
    { id: element.id, class: element.classNames.join(' ') },
    rawAttributes,
    newParent
  );

  const children = element.childNodes.map((child) => {
    if (child instanceof HTMLElement) {
      return clone(child, undefined);
    }
    return child;
  });
  result.set_content(children); // sets the parentNode of children

  if (newParent !== undefined) {
    result.parentNode = newParent;
  }

  return result;
}

function getChildIndex(element: HTMLElement) {
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
export function resolveTableSpans(table: HTMLElement) {
  const spanningCells = table
    .querySelectorAll('td')
    .filter((cell) => cell.hasAttribute(ROW_SPAN_ATTR));

  for (const cell of spanningCells) {
    const span = parseInt(cell.getAttribute(ROW_SPAN_ATTR) as string);
    if (isNaN(span)) {
      throw new Error(`Invalid ${ROW_SPAN_ATTR} atribute value in ${cell}`);
    }
    cell.removeAttribute(ROW_SPAN_ATTR); // resolved
    const columnIndex = getChildIndex(cell);

    let row = cell.parentNode as HTMLElement;
    for (let i = 1; (row = row.nextElementSibling) !== null && i < span; i++) {
      const newCell = clone(cell, row);
      row.childNodes.splice(columnIndex, 0, newCell);
    }
  }
}

// Maps

export function pushToMapValue<K, V>(
  map: Map<K, V[]>,
  key: K,
  newElements: V[]
) {
  const previous = map.get(key);
  if (previous) {
    previous.push(...newElements);
  } else {
    map.set(key, newElements);
  }
}

// JSON files

export async function readJsonFile(filePath: string) {
  const contents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(contents);
}

export async function writeJsonFile(filePath: string, contents: unknown) {
  // A line is terminated by a newline character on POSIX-compliant systems.
  const toWrite = `${JSON.stringify(contents)}\n`;
  await fs.writeFile(filePath, toWrite, 'utf8');
}

import { DOMElement } from '../types';

// Helper to simplify DOM elements into a string for the AI
export function simplifyDOMElements(elements: DOMElement[]): string {
  function elementToString(el: DOMElement, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}<${el.tag}`;

    if (el.id) str += ` id="${el.id}"`;
    if (el.className) str += ` class="${el.className}"`;
    if (el.href) str += ` href="${truncate(el.href, 60)}"`;
    if (el.type) str += ` type="${el.type}"`;
    if (el.placeholder) str += ` placeholder="${el.placeholder}"`;
    if (el.value) str += ` value="${truncate(el.value, 30)}"`;

    str += '>';

    if (el.text) {
      str += truncate(el.text, 100);
    }

    if (el.children && el.children.length > 0) {
      str += '\n';
      for (const child of el.children) {
        str += elementToString(child, indent + 1) + '\n';
      }
      str += spaces;
    }

    str += `</${el.tag}>`;
    return str;
  }

  return elements.map((el) => elementToString(el)).join('\n');
}

// Truncate strings
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// Build a CSS selector for an element
export function buildSelector(el: DOMElement): string {
  if (el.id) return `#${el.id}`;

  let selector = el.tag;

  if (el.className) {
    const classes = el.className.split(' ').filter((c) => c && !c.includes(':'));
    if (classes.length > 0) {
      selector += '.' + classes.slice(0, 2).join('.');
    }
  }

  return selector;
}

// Find elements matching criteria
export function findElements(
  elements: DOMElement[],
  predicate: (el: DOMElement) => boolean
): DOMElement[] {
  const results: DOMElement[] = [];

  function search(els: DOMElement[]) {
    for (const el of els) {
      if (predicate(el)) {
        results.push(el);
      }
      if (el.children) {
        search(el.children);
      }
    }
  }

  search(elements);
  return results;
}

// Find interactive elements
export function findInteractiveElements(elements: DOMElement[]): DOMElement[] {
  const interactiveTags = ['a', 'button', 'input', 'textarea', 'select'];
  return findElements(elements, (el) => interactiveTags.includes(el.tag));
}

// Find elements by text content
export function findByText(elements: DOMElement[], text: string): DOMElement[] {
  const lowerText = text.toLowerCase();
  return findElements(
    elements,
    (el) => el.text?.toLowerCase().includes(lowerText) || false
  );
}

// Wait for a condition with timeout
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 200
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  return false;
}

import { WebContents } from 'electron';
import { DOMElement } from '../../src/types';

export async function captureScreenshot(webContents: WebContents): Promise<string> {
  try {
    const debugger_ = webContents.debugger;

    const result = await debugger_.sendCommand('Page.captureScreenshot', {
      format: 'png',
      quality: 80,
      captureBeyondViewport: false,
    });

    return result.data; // base64 encoded PNG
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    throw error;
  }
}

export async function extractDOM(webContents: WebContents): Promise<DOMElement[]> {
  try {
    const result = await webContents.executeJavaScript(`
      (function() {
        function extractElement(el, depth = 0) {
          if (depth > 5) return null; // Limit depth
          if (!el || el.nodeType !== 1) return null;

          const tag = el.tagName.toLowerCase();

          // Skip hidden elements
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return null;
          }

          // Skip script, style, and other non-content elements
          const skipTags = ['script', 'style', 'noscript', 'svg', 'path', 'meta', 'link', 'head'];
          if (skipTags.includes(tag)) {
            return null;
          }

          const rect = el.getBoundingClientRect();

          // Skip elements that are off-screen or too small
          if (rect.width < 5 || rect.height < 5) {
            return null;
          }

          const element = {
            tag,
            id: el.id || undefined,
            className: el.className && typeof el.className === 'string' ? el.className.split(' ').filter(c => c).slice(0, 3).join(' ') : undefined,
            text: undefined,
            href: undefined,
            src: undefined,
            type: undefined,
            value: undefined,
            placeholder: undefined,
            bounds: {
              x: Math.round(rect.x),
              y: Math.round(rect.y),
              width: Math.round(rect.width),
              height: Math.round(rect.height)
            },
            children: []
          };

          // Extract relevant attributes based on tag
          if (tag === 'a') {
            element.href = el.href;
          }
          if (tag === 'img') {
            element.src = el.src;
            element.text = el.alt;
          }
          if (tag === 'input' || tag === 'textarea') {
            element.type = el.type;
            element.value = el.value;
            element.placeholder = el.placeholder;
          }
          if (tag === 'button' || tag === 'a' || tag === 'label' || tag === 'span' || tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6' || tag === 'li' || tag === 'td' || tag === 'th') {
            const text = el.innerText || el.textContent;
            if (text) {
              element.text = text.trim().substring(0, 200); // Limit text length
            }
          }

          // Extract children (for container elements)
          const containerTags = ['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'aside', 'ul', 'ol', 'table', 'tbody', 'thead', 'tr', 'form', 'fieldset'];
          if (containerTags.includes(tag)) {
            const children = [];
            for (const child of el.children) {
              const extracted = extractElement(child, depth + 1);
              if (extracted) {
                children.push(extracted);
              }
            }
            element.children = children;
          }

          return element;
        }

        const body = document.body;
        const elements = [];

        for (const child of body.children) {
          const extracted = extractElement(child, 0);
          if (extracted) {
            elements.push(extracted);
          }
        }

        return elements;
      })()
    `);

    return result as DOMElement[];
  } catch (error) {
    console.error('Failed to extract DOM:', error);
    return [];
  }
}

export async function extractInteractiveElements(webContents: WebContents): Promise<DOMElement[]> {
  try {
    const result = await webContents.executeJavaScript(`
      (function() {
        const interactiveSelectors = [
          'a[href]',
          'button',
          'input',
          'textarea',
          'select',
          '[role="button"]',
          '[role="link"]',
          '[onclick]',
          '[tabindex]'
        ];

        const elements = [];

        interactiveSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
            const rect = el.getBoundingClientRect();

            // Skip hidden or off-screen elements
            if (rect.width < 5 || rect.height < 5) return;

            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;

            const tag = el.tagName.toLowerCase();

            elements.push({
              tag,
              id: el.id || undefined,
              className: el.className && typeof el.className === 'string' ? el.className.split(' ').filter(c => c).slice(0, 3).join(' ') : undefined,
              text: (el.innerText || el.textContent || el.value || el.placeholder || '').trim().substring(0, 100),
              href: el.href || undefined,
              type: el.type || undefined,
              bounds: {
                x: Math.round(rect.x),
                y: Math.round(rect.y),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
              }
            });
          });
        });

        // Remove duplicates based on position
        const unique = [];
        const seen = new Set();

        for (const el of elements) {
          const key = el.bounds.x + ',' + el.bounds.y + ',' + el.bounds.width + ',' + el.bounds.height;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(el);
          }
        }

        return unique;
      })()
    `);

    return result as DOMElement[];
  } catch (error) {
    console.error('Failed to extract interactive elements:', error);
    return [];
  }
}

export async function extractText(webContents: WebContents, selector?: string): Promise<string> {
  try {
    const script = selector
      ? `
        (function() {
          const el = document.querySelector('${selector.replace(/'/g, "\\'")}');
          return el ? (el.innerText || el.textContent || '') : '';
        })()
      `
      : `
        (function() {
          return document.body.innerText || '';
        })()
      `;

    const result = await webContents.executeJavaScript(script);
    return result as string;
  } catch (error) {
    console.error('Failed to extract text:', error);
    return '';
  }
}

export async function getPageInfo(webContents: WebContents): Promise<{
  url: string;
  title: string;
  viewport: { width: number; height: number };
  scrollPosition: { x: number; y: number };
  documentSize: { width: number; height: number };
}> {
  try {
    const result = await webContents.executeJavaScript(`
      (function() {
        return {
          url: window.location.href,
          title: document.title,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY
          },
          documentSize: {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight
          }
        };
      })()
    `);

    return result;
  } catch (error) {
    console.error('Failed to get page info:', error);
    return {
      url: '',
      title: '',
      viewport: { width: 0, height: 0 },
      scrollPosition: { x: 0, y: 0 },
      documentSize: { width: 0, height: 0 },
    };
  }
}

export function simplifyDOM(elements: DOMElement[]): string {
  function elementToString(el: DOMElement, indent = 0): string {
    const spaces = '  '.repeat(indent);
    let str = `${spaces}<${el.tag}`;

    if (el.id) str += ` id="${el.id}"`;
    if (el.className) str += ` class="${el.className}"`;
    if (el.href) str += ` href="${el.href}"`;
    if (el.type) str += ` type="${el.type}"`;
    if (el.placeholder) str += ` placeholder="${el.placeholder}"`;

    str += '>';

    if (el.text) {
      str += el.text.substring(0, 50);
      if (el.text.length > 50) str += '...';
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

  return elements.map(el => elementToString(el)).join('\n');
}

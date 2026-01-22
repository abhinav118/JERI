import { WebContents } from 'electron';
import { BrowserAction } from '../../src/types';

export async function executeAction(
  webContents: WebContents,
  action: BrowserAction
): Promise<{ success: boolean; error?: string; result?: string }> {
  try {
    switch (action.type) {
      case 'click':
        if (!action.selector) {
          return { success: false, error: 'Selector required for click action' };
        }
        await clickElement(webContents, action.selector);
        return { success: true };

      case 'type':
        if (!action.selector || !action.value) {
          return { success: false, error: 'Selector and value required for type action' };
        }
        await typeText(webContents, action.selector, action.value);
        return { success: true };

      case 'scroll':
        await scrollPage(webContents, action.direction || 'down', action.amount);
        return { success: true };

      case 'navigate':
        if (!action.value) {
          return { success: false, error: 'URL required for navigate action' };
        }
        await navigateToUrl(webContents, action.value);
        return { success: true };

      case 'extract':
        const result = await extractContent(webContents, action.selector);
        return { success: true, result };

      case 'wait':
        await wait(action.amount || 1000);
        return { success: true };

      case 'done':
        return { success: true, result: action.value };

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

async function clickElement(webContents: WebContents, selector: string): Promise<void> {
  // Get element bounds using JavaScript
  const bounds = await webContents.executeJavaScript(`
    (function() {
      const el = document.querySelector('${escapeSelector(selector)}');
      if (!el) throw new Error('Element not found: ${escapeSelector(selector)}');
      const rect = el.getBoundingClientRect();
      return {
        x: rect.x + window.scrollX,
        y: rect.y + window.scrollY,
        width: rect.width,
        height: rect.height,
        viewportX: rect.x,
        viewportY: rect.y
      };
    })()
  `);

  // Calculate click position (center of element)
  const x = bounds.viewportX + bounds.width / 2;
  const y = bounds.viewportY + bounds.height / 2;

  // Use CDP to dispatch mouse events
  const debugger_ = webContents.debugger;

  // Move mouse to element
  await debugger_.sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x,
    y,
  });

  // Mouse down
  await debugger_.sendCommand('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });

  // Mouse up
  await debugger_.sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
  });
}

async function typeText(
  webContents: WebContents,
  selector: string,
  text: string
): Promise<void> {
  // First click on the element to focus it
  await clickElement(webContents, selector);

  // Wait a bit for focus
  await wait(100);

  // Clear existing text
  await webContents.executeJavaScript(`
    (function() {
      const el = document.querySelector('${escapeSelector(selector)}');
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);

  // Type the text using CDP
  const debugger_ = webContents.debugger;

  // Insert text directly
  await debugger_.sendCommand('Input.insertText', {
    text,
  });

  // Dispatch input event
  await webContents.executeJavaScript(`
    (function() {
      const el = document.querySelector('${escapeSelector(selector)}');
      if (el) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
}

async function scrollPage(
  webContents: WebContents,
  direction: 'up' | 'down',
  amount?: number
): Promise<void> {
  const scrollAmount = amount || 500;
  const deltaY = direction === 'down' ? scrollAmount : -scrollAmount;

  const debugger_ = webContents.debugger;

  // Get viewport size
  const viewport = await webContents.executeJavaScript(`
    ({ width: window.innerWidth, height: window.innerHeight })
  `);

  // Dispatch scroll event at center of viewport
  await debugger_.sendCommand('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: viewport.width / 2,
    y: viewport.height / 2,
    deltaX: 0,
    deltaY,
  });
}

async function navigateToUrl(webContents: WebContents, url: string): Promise<void> {
  let finalUrl = url;

  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.includes(' ')) {
      finalUrl = `https://${url}`;
    } else {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }
  }

  await webContents.loadURL(finalUrl);
}

async function extractContent(
  webContents: WebContents,
  selector?: string
): Promise<string> {
  const script = selector
    ? `
      (function() {
        const el = document.querySelector('${escapeSelector(selector)}');
        return el ? el.textContent || el.innerText : null;
      })()
    `
    : `
      (function() {
        return document.body.innerText;
      })()
    `;

  const result = await webContents.executeJavaScript(script);
  return result || '';
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeSelector(selector: string): string {
  // Escape single quotes for use in JavaScript string
  return selector.replace(/'/g, "\\'");
}

// Press Enter key
export async function pressEnter(webContents: WebContents): Promise<void> {
  const debugger_ = webContents.debugger;

  await debugger_.sendCommand('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });

  await debugger_.sendCommand('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  });
}

// Press key by name
export async function pressKey(
  webContents: WebContents,
  key: string
): Promise<void> {
  const debugger_ = webContents.debugger;

  await debugger_.sendCommand('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key,
  });

  await debugger_.sendCommand('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key,
  });
}

import { WebContents, ipcMain } from 'electron';
import { executeAction, pressEnter, pressKey } from './actions';
import {
  captureScreenshot,
  extractDOM,
  extractInteractiveElements,
  extractText,
  getPageInfo,
  simplifyDOM,
} from './extraction';
import { BrowserAction } from '../../src/types';

export class CDPManager {
  private getWebContents: () => WebContents | null;

  constructor(getWebContents: () => WebContents | null) {
    this.getWebContents = getWebContents;
    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('capture-screen', async () => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        const screenshot = await captureScreenshot(webContents);
        return { success: true, data: screenshot };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('extract-dom', async () => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        const dom = await extractDOM(webContents);
        return { success: true, data: dom };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('extract-interactive', async () => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        const elements = await extractInteractiveElements(webContents);
        return { success: true, data: elements };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('extract-text', async (_, selector?: string) => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        const text = await extractText(webContents, selector);
        return { success: true, data: text };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('get-page-info', async () => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        const info = await getPageInfo(webContents);
        return { success: true, data: info };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('execute-action', async (_, action: BrowserAction) => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      return executeAction(webContents, action);
    });

    ipcMain.handle('press-enter', async () => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        await pressEnter(webContents);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });

    ipcMain.handle('press-key', async (_, key: string) => {
      const webContents = this.getWebContents();
      if (!webContents) {
        return { success: false, error: 'No active tab' };
      }
      try {
        await pressKey(webContents, key);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    });
  }
}

export {
  executeAction,
  pressEnter,
  pressKey,
  captureScreenshot,
  extractDOM,
  extractInteractiveElements,
  extractText,
  getPageInfo,
  simplifyDOM,
};

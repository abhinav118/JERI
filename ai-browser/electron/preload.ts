import { contextBridge, ipcRenderer } from 'electron';
import type { BrowserAction, Tab, DOMElement, AgentStatus } from '../src/types';

// Type-safe event listener management
type Callback<T> = (data: T) => void;

function createEventHandler<T>(channel: string) {
  return (callback: Callback<T>): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: T) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  };
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Browser navigation
  navigate: (url: string): Promise<void> => ipcRenderer.invoke('navigate', url),
  goBack: (): Promise<void> => ipcRenderer.invoke('go-back'),
  goForward: (): Promise<void> => ipcRenderer.invoke('go-forward'),
  reload: (): Promise<void> => ipcRenderer.invoke('reload'),

  // Tab management
  createTab: (url?: string): Promise<Tab> => ipcRenderer.invoke('create-tab', url),
  closeTab: (id: string): Promise<void> => ipcRenderer.invoke('close-tab', id),
  switchTab: (id: string): Promise<void> => ipcRenderer.invoke('switch-tab', id),
  getTabs: (): Promise<Tab[]> => ipcRenderer.invoke('get-tabs'),

  // Agent/CDP actions
  captureScreen: (): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('capture-screen'),

  extractDOM: (): Promise<{ success: boolean; data?: DOMElement[]; error?: string }> =>
    ipcRenderer.invoke('extract-dom'),

  extractInteractive: (): Promise<{ success: boolean; data?: DOMElement[]; error?: string }> =>
    ipcRenderer.invoke('extract-interactive'),

  extractText: (selector?: string): Promise<{ success: boolean; data?: string; error?: string }> =>
    ipcRenderer.invoke('extract-text', selector),

  getPageInfo: (): Promise<{
    success: boolean;
    data?: {
      url: string;
      title: string;
      viewport: { width: number; height: number };
      scrollPosition: { x: number; y: number };
      documentSize: { width: number; height: number };
    };
    error?: string;
  }> => ipcRenderer.invoke('get-page-info'),

  executeAction: (
    action: BrowserAction
  ): Promise<{ success: boolean; error?: string; result?: string }> =>
    ipcRenderer.invoke('execute-action', action),

  pressEnter: (): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('press-enter'),

  pressKey: (key: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('press-key', key),

  // App info
  getAppInfo: (): Promise<{ version: string; platform: string }> =>
    ipcRenderer.invoke('get-app-info'),

  // Sidebar
  setSidebarWidth: (width: number): Promise<void> =>
    ipcRenderer.invoke('set-sidebar-width', width),

  // Event listeners
  onUrlChange: createEventHandler<string>('url-changed'),
  onTitleChange: createEventHandler<string>('title-changed'),
  onTabsChange: createEventHandler<Tab[]>('tabs-changed'),
  onLoadingChange: createEventHandler<boolean>('loading-changed'),
  onAgentStatus: createEventHandler<AgentStatus>('agent-status'),
});

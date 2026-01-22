import { BrowserWindow, BrowserView, ipcMain, WebContents } from 'electron';
import { Tab } from '../src/types';

interface ManagedTab {
  id: string;
  view: BrowserView;
  url: string;
  title: string;
  isLoading: boolean;
}

export class BrowserManager {
  private mainWindow: BrowserWindow;
  private tabs: Map<string, ManagedTab> = new Map();
  private activeTabId: string | null = null;
  private tabCounter = 0;
  private sidebarWidth = 0;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('navigate', async (_, url: string) => {
      await this.navigate(url);
    });

    ipcMain.handle('go-back', async () => {
      await this.goBack();
    });

    ipcMain.handle('go-forward', async () => {
      await this.goForward();
    });

    ipcMain.handle('reload', async () => {
      await this.reload();
    });

    ipcMain.handle('create-tab', async (_, url?: string) => {
      return this.createTab(url);
    });

    ipcMain.handle('close-tab', async (_, id: string) => {
      await this.closeTab(id);
    });

    ipcMain.handle('switch-tab', async (_, id: string) => {
      await this.switchTab(id);
    });

    ipcMain.handle('get-tabs', async () => {
      return this.getTabs();
    });

    ipcMain.handle('set-sidebar-width', async (_, width: number) => {
      this.sidebarWidth = width;
      this.resizeView();
    });
  }

  createTab(url?: string): Tab {
    const id = `tab-${++this.tabCounter}`;
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });

    const initialUrl = url || 'https://www.google.com';

    const managedTab: ManagedTab = {
      id,
      view,
      url: initialUrl,
      title: 'New Tab',
      isLoading: true,
    };

    this.tabs.set(id, managedTab);

    // Setup event listeners for this tab
    this.setupTabListeners(managedTab);

    // Load the URL
    view.webContents.loadURL(initialUrl);

    // Attach CDP debugger
    this.attachDebugger(view.webContents);

    // Make this the active tab
    this.switchTab(id);

    return {
      id,
      url: initialUrl,
      title: 'New Tab',
      isLoading: true,
    };
  }

  private setupTabListeners(tab: ManagedTab): void {
    const { view, id } = tab;

    view.webContents.on('did-start-loading', () => {
      tab.isLoading = true;
      this.notifyLoadingChange(true);
      this.notifyTabsChange();
    });

    view.webContents.on('did-stop-loading', () => {
      tab.isLoading = false;
      this.notifyLoadingChange(false);
      this.notifyTabsChange();
    });

    view.webContents.on('did-navigate', (_, url) => {
      tab.url = url;
      if (this.activeTabId === id) {
        this.notifyUrlChange(url);
      }
      this.notifyTabsChange();
    });

    view.webContents.on('did-navigate-in-page', (_, url) => {
      tab.url = url;
      if (this.activeTabId === id) {
        this.notifyUrlChange(url);
      }
      this.notifyTabsChange();
    });

    view.webContents.on('page-title-updated', (_, title) => {
      tab.title = title;
      if (this.activeTabId === id) {
        this.notifyTitleChange(title);
      }
      this.notifyTabsChange();
    });

    // Handle new window requests (open in new tab)
    view.webContents.setWindowOpenHandler(({ url }) => {
      this.createTab(url);
      return { action: 'deny' };
    });
  }

  private attachDebugger(webContents: WebContents): void {
    try {
      webContents.debugger.attach('1.3');
      console.log('CDP debugger attached');
    } catch (err) {
      console.error('Failed to attach debugger:', err);
    }
  }

  async switchTab(id: string): Promise<void> {
    const tab = this.tabs.get(id);
    if (!tab) return;

    // Remove current view
    if (this.activeTabId) {
      const currentTab = this.tabs.get(this.activeTabId);
      if (currentTab) {
        this.mainWindow.removeBrowserView(currentTab.view);
      }
    }

    // Add and resize new view
    this.mainWindow.addBrowserView(tab.view);
    this.activeTabId = id;
    this.resizeView();

    // Notify renderer of current state
    this.notifyUrlChange(tab.url);
    this.notifyTitleChange(tab.title);
    this.notifyLoadingChange(tab.isLoading);
    this.notifyTabsChange();
  }

  async closeTab(id: string): Promise<void> {
    const tab = this.tabs.get(id);
    if (!tab) return;

    // Detach debugger
    try {
      if (tab.view.webContents.debugger.isAttached()) {
        tab.view.webContents.debugger.detach();
      }
    } catch (_) {
      // Ignore errors
    }

    // Remove view
    if (this.activeTabId === id) {
      this.mainWindow.removeBrowserView(tab.view);
    }

    // Destroy the view
    // Note: BrowserView.destroy() is deprecated, we just remove references
    this.tabs.delete(id);

    // Switch to another tab if this was active
    if (this.activeTabId === id) {
      const remainingTabs = Array.from(this.tabs.keys());
      if (remainingTabs.length > 0) {
        await this.switchTab(remainingTabs[0]);
      } else {
        this.activeTabId = null;
        // Create a new tab
        this.createTab();
      }
    }

    this.notifyTabsChange();
  }

  async navigate(url: string): Promise<void> {
    const tab = this.getActiveTab();
    if (!tab) return;

    // Add protocol if missing
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it looks like a URL or a search query
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = `https://${url}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }

    tab.view.webContents.loadURL(finalUrl);
  }

  async goBack(): Promise<void> {
    const tab = this.getActiveTab();
    if (tab?.view.webContents.canGoBack()) {
      tab.view.webContents.goBack();
    }
  }

  async goForward(): Promise<void> {
    const tab = this.getActiveTab();
    if (tab?.view.webContents.canGoForward()) {
      tab.view.webContents.goForward();
    }
  }

  async reload(): Promise<void> {
    const tab = this.getActiveTab();
    tab?.view.webContents.reload();
  }

  getTabs(): Tab[] {
    return Array.from(this.tabs.values()).map(tab => ({
      id: tab.id,
      url: tab.url,
      title: tab.title,
      isLoading: tab.isLoading,
    }));
  }

  getActiveTab(): ManagedTab | null {
    if (!this.activeTabId) return null;
    return this.tabs.get(this.activeTabId) || null;
  }

  getActiveWebContents(): WebContents | null {
    return this.getActiveTab()?.view.webContents || null;
  }

  resizeView(): void {
    const tab = this.getActiveTab();
    if (!tab) return;

    const bounds = this.mainWindow.getBounds();
    // Leave space for browser chrome (tabs + address bar)
    const chromeHeight = 90;
    // Leave space for command input at bottom
    const bottomHeight = 80;

    tab.view.setBounds({
      x: 0,
      y: chromeHeight,
      width: bounds.width - this.sidebarWidth,
      height: bounds.height - chromeHeight - bottomHeight,
    });
  }

  private notifyUrlChange(url: string): void {
    this.mainWindow.webContents.send('url-changed', url);
  }

  private notifyTitleChange(title: string): void {
    this.mainWindow.webContents.send('title-changed', title);
  }

  private notifyLoadingChange(isLoading: boolean): void {
    this.mainWindow.webContents.send('loading-changed', isLoading);
  }

  private notifyTabsChange(): void {
    this.mainWindow.webContents.send('tabs-changed', this.getTabs());
  }
}

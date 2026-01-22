// Browser Action types for CDP control
export interface BrowserAction {
  type: 'click' | 'type' | 'scroll' | 'navigate' | 'extract' | 'wait' | 'done';
  selector?: string;
  value?: string;
  direction?: 'up' | 'down';
  amount?: number;
}

// Agent response from Claude
export interface AgentResponse {
  thought: string;
  action: BrowserAction['type'];
  selector?: string;
  value?: string;
  direction?: 'up' | 'down';
  amount?: number;
  done: boolean;
  result?: string;
}

// Tab representation
export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
}

// Companion (AI agent) definition
export interface Companion {
  id: string;
  name: string;
  avatar: string;
  description: string;
  systemPrompt: string;
  approvalRequired: string[];
}

// Agent execution status
export interface AgentStatus {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  currentAction?: string;
  thought?: string;
}

// Agent execution result
export interface AgentResult {
  success: boolean;
  result?: string;
  error?: string;
  steps: AgentStep[];
}

// Single agent step
export interface AgentStep {
  thought: string;
  action: BrowserAction;
  screenshot?: string;
  result?: string;
}

// Message in conversation history
export interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

// Chat message for sidebar chat UI
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface MessageContent {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: 'image/png';
    data: string;
  };
}

// DOM element representation
export interface DOMElement {
  tag: string;
  id?: string;
  className?: string;
  text?: string;
  href?: string;
  src?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  children?: DOMElement[];
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Page state for agent
export interface PageState {
  url: string;
  title: string;
  screenshot: string; // base64
  dom: DOMElement[];
  text: string;
}

// IPC API exposed to renderer
export interface ElectronAPI {
  // Browser control
  navigate: (url: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  reload: () => Promise<void>;

  // Tab management
  createTab: (url?: string) => Promise<Tab>;
  closeTab: (id: string) => Promise<void>;
  switchTab: (id: string) => Promise<void>;
  getTabs: () => Promise<Tab[]>;

  // Agent actions
  captureScreen: () => Promise<{ success: boolean; data?: string; error?: string }>;
  extractDOM: () => Promise<{ success: boolean; data?: DOMElement[]; error?: string }>;
  extractPageText: () => Promise<{ success: boolean; data?: string; error?: string }>;
  executeAction: (action: BrowserAction) => Promise<{ success: boolean; error?: string; result?: string }>;

  // UI control
  setSidebarWidth: (width: number) => Promise<void>;

  // Events
  onUrlChange: (callback: (url: string) => void) => () => void;
  onTitleChange: (callback: (title: string) => void) => () => void;
  onTabsChange: (callback: (tabs: Tab[]) => void) => () => void;
  onLoadingChange: (callback: (isLoading: boolean) => void) => () => void;
  onAgentStatus: (callback: (status: AgentStatus) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

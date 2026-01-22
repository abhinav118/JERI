import { useState, useEffect } from 'react';
import BrowserChrome from './components/BrowserChrome';
import Sidebar from './components/Sidebar';
import ApprovalDialog from './components/ApprovalDialog';
import SettingsDialog from './components/SettingsDialog';
import { Tab, Companion, AgentStatus, BrowserAction, ChatMessage } from './types';
import { hasApiKey, chat } from './lib/llm';
import { defaultCompanion } from './agents/companions';

function App() {
  // Browser state
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [currentTitle, setCurrentTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion>(defaultCompanion);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Settings dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Agent state
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
  });

  // Approval dialog state
  const [pendingApproval, setPendingApproval] = useState<{
    action: BrowserAction;
    description: string;
  } | null>(null);

  // Set up IPC listeners
  useEffect(() => {
    if (!window.electronAPI) {
      console.error('electronAPI not available');
      return;
    }

    const unsubUrl = window.electronAPI.onUrlChange((url) => {
      setCurrentUrl(url);
    });

    const unsubTitle = window.electronAPI.onTitleChange((title) => {
      setCurrentTitle(title);
    });

    const unsubTabs = window.electronAPI.onTabsChange((newTabs) => {
      setTabs(newTabs);
      if (newTabs.length > 0 && !activeTabId) {
        setActiveTabId(newTabs[0].id);
      }
    });

    const unsubLoading = window.electronAPI.onLoadingChange((loading) => {
      setIsLoading(loading);
    });

    const unsubAgent = window.electronAPI.onAgentStatus((status) => {
      setAgentStatus(status);
    });

    // Get initial tabs
    window.electronAPI.getTabs().then(setTabs);

    return () => {
      unsubUrl();
      unsubTitle();
      unsubTabs();
      unsubLoading();
      unsubAgent();
    };
  }, [activeTabId]);

  // Navigation handlers
  const handleNavigate = async (url: string) => {
    await window.electronAPI.navigate(url);
  };

  const handleGoBack = async () => {
    await window.electronAPI.goBack();
  };

  const handleGoForward = async () => {
    await window.electronAPI.goForward();
  };

  const handleReload = async () => {
    await window.electronAPI.reload();
  };

  // Tab handlers
  const handleCreateTab = async (url?: string) => {
    const tab = await window.electronAPI.createTab(url);
    setActiveTabId(tab.id);
  };

  const handleCloseTab = async (id: string) => {
    await window.electronAPI.closeTab(id);
  };

  const handleSwitchTab = async (id: string) => {
    await window.electronAPI.switchTab(id);
    setActiveTabId(id);
  };

  // Companion handlers
  const handleSelectCompanion = (companion: Companion) => {
    setSelectedCompanion(companion);
    // Clear chat when switching companions
    setChatMessages([]);
  };

  // Get browser context for the AI
  const getBrowserContext = async (): Promise<string> => {
    try {
      // Get screenshot and DOM info
      const [screenshotResult, domResult] = await Promise.all([
        window.electronAPI.captureScreen(),
        window.electronAPI.extractDOM(),
      ]);

      let context = `Current Page:\n- URL: ${currentUrl}\n- Title: ${currentTitle}\n\n`;

      if (domResult.success && domResult.data) {
        // Extract text content from DOM
        const extractText = (elements: any[], depth = 0): string => {
          let text = '';
          for (const el of elements.slice(0, 50)) { // Limit elements
            if (el.text && el.text.trim()) {
              text += el.text.trim() + '\n';
            }
            if (el.children) {
              text += extractText(el.children, depth + 1);
            }
          }
          return text;
        };

        const pageText = extractText(domResult.data).slice(0, 3000); // Limit text
        context += `Page Content:\n${pageText}\n`;
      }

      return context;
    } catch (error) {
      console.error('Failed to get browser context:', error);
      return `Current Page:\n- URL: ${currentUrl}\n- Title: ${currentTitle}\n`;
    }
  };

  // Chat message handler
  const handleSendMessage = async (message: string) => {
    console.log('handleSendMessage called with:', message);

    if (!hasApiKey()) {
      console.log('No API key, opening settings');
      setIsSettingsOpen(true);
      return;
    }

    const messageId = Date.now();

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${messageId}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `assistant-${messageId}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    // Add both messages at once
    setChatMessages(prev => [...prev, userMessage, loadingMessage]);

    setAgentStatus({
      isRunning: true,
      currentStep: 1,
      totalSteps: 1,
      thought: 'Analyzing page context...',
    });

    try {
      // Get browser context
      let browserContext = '';
      try {
        browserContext = await getBrowserContext();
        console.log('Browser context retrieved, length:', browserContext.length);
      } catch (contextError) {
        console.warn('Failed to get browser context:', contextError);
        browserContext = `Current Page:\n- URL: ${currentUrl || 'unknown'}\n- Title: ${currentTitle || 'unknown'}\n`;
      }

      // Build conversation history for context (exclude the messages we just added)
      const conversationHistory = chatMessages
        .filter(m => !m.isLoading)
        .slice(-10)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Create the prompt with browser context
      const contextualPrompt = `${browserContext}\n\nUser question: ${message}\n\nRespond helpfully based on the page context. If the user asks about the page, use the content above. Keep your response concise and conversational.`;

      setAgentStatus(prev => ({ ...prev, thought: 'Generating response...' }));
      console.log('Calling Gemini API...');

      // Get AI response
      const response = await chat(
        selectedCompanion.systemPrompt,
        [...conversationHistory, { role: 'user', content: contextualPrompt }]
      );

      console.log('Got response from Gemini:', response.substring(0, 100));

      // Parse response - check if it's JSON (action) or plain text (chat)
      let responseText = response;
      try {
        const parsed = JSON.parse(response);
        if (parsed.thought && parsed.action) {
          if (parsed.done && parsed.result) {
            responseText = parsed.result;
          } else {
            responseText = parsed.thought;
          }
        }
      } catch {
        // It's plain text, use as is
      }

      // Update the loading message with the response
      setChatMessages(prev =>
        prev.map(m =>
          m.id === loadingMessage.id
            ? { ...m, content: responseText, isLoading: false }
            : m
        )
      );

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response';

      // Update loading message with error
      setChatMessages(prev =>
        prev.map(m =>
          m.id === loadingMessage.id
            ? { ...m, content: `Error: ${errorMessage}`, isLoading: false }
            : m
        )
      );
    } finally {
      setAgentStatus({
        isRunning: false,
        currentStep: 0,
        totalSteps: 0,
      });
    }
  };

  // Approval handlers
  const handleApprove = () => {
    if ((window as any).__approvalResolver) {
      (window as any).__approvalResolver(true);
      (window as any).__approvalResolver = null;
    }
    setPendingApproval(null);
  };

  const handleDeny = () => {
    if ((window as any).__approvalResolver) {
      (window as any).__approvalResolver(false);
      (window as any).__approvalResolver = null;
    }
    setPendingApproval(null);
  };

  return (
    <div className="h-full w-full flex flex-col bg-browser-bg">
      {/* Browser Chrome (tabs + address bar) */}
      <BrowserChrome
        tabs={tabs}
        activeTabId={activeTabId}
        currentUrl={currentUrl}
        isLoading={isLoading}
        onNavigate={handleNavigate}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onCreateTab={handleCreateTab}
        onCloseTab={handleCloseTab}
        onSwitchTab={handleSwitchTab}
        onToggleSidebar={() => {
          const newState = !isSidebarOpen;
          setIsSidebarOpen(newState);
          window.electronAPI.setSidebarWidth(newState ? 320 : 0);
        }}
        isSidebarOpen={isSidebarOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main content area - BrowserView is positioned here via Electron */}
      <div className="flex-1 relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            window.electronAPI.setSidebarWidth(0);
          }}
          selectedCompanion={selectedCompanion}
          onSelectCompanion={handleSelectCompanion}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          agentStatus={agentStatus}
        />
      </div>

      {/* Approval dialog */}
      {pendingApproval && (
        <ApprovalDialog
          action={pendingApproval.action}
          description={pendingApproval.description}
          onApprove={handleApprove}
          onDeny={handleDeny}
        />
      )}

      {/* Settings dialog */}
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;

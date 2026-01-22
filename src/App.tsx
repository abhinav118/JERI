import { useState, useEffect } from 'react';
import BrowserChrome from './components/BrowserChrome';
import Sidebar from './components/Sidebar';
import CommandInput from './components/CommandInput';
import ApprovalDialog from './components/ApprovalDialog';
import SettingsDialog from './components/SettingsDialog';
import { Tab, Companion, AgentStatus, BrowserAction } from './types';
import { hasApiKey } from './lib/llm';

function App() {
  // Browser state
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  // Title is tracked for future tab display features
  const [, setCurrentTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);

  // Settings dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Agent state
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
  });
  const [agentResult, setAgentResult] = useState<string | null>(null);

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
    setAgentResult(null);
  };

  // Command handler - runs agent
  const handleCommand = async (command: string) => {
    if (!selectedCompanion) {
      alert('Please select a companion first');
      return;
    }

    if (!hasApiKey()) {
      setIsSettingsOpen(true);
      return;
    }

    setAgentStatus({
      isRunning: true,
      currentStep: 0,
      totalSteps: 0,
      thought: 'Starting...',
    });
    setAgentResult(null);

    try {
      // Import and run agent engine
      const { AgentEngine } = await import('./agents/AgentEngine');
      const engine = new AgentEngine();

      const result = await engine.run(
        command,
        selectedCompanion,
        (status) => setAgentStatus(status),
        async (action, description) => {
          return new Promise((resolve) => {
            setPendingApproval({
              action,
              description,
            });
            // This will be resolved by the approval dialog
            (window as any).__approvalResolver = resolve;
          });
        }
      );

      if (result.success) {
        setAgentResult(result.result || 'Task completed successfully');
      } else {
        setAgentResult(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Agent error:', error);
      setAgentResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
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
          agentStatus={agentStatus}
          agentResult={agentResult}
        />
      </div>

      {/* Command input at bottom */}
      <CommandInput
        onSubmit={handleCommand}
        isRunning={agentStatus.isRunning}
        companion={selectedCompanion}
        currentThought={agentStatus.thought}
      />

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

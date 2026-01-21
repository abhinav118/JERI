// Local storage helpers for browser-side storage
// SQLite integration would be in main process

// Store extracted data
export function saveExtractedData(key: string, data: unknown): void {
  try {
    const stored = JSON.parse(localStorage.getItem('extracted_data') || '{}');
    stored[key] = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem('extracted_data', JSON.stringify(stored));
  } catch (error) {
    console.error('Failed to save extracted data:', error);
  }
}

// Get extracted data
export function getExtractedData(key: string): unknown | null {
  try {
    const stored = JSON.parse(localStorage.getItem('extracted_data') || '{}');
    return stored[key]?.data || null;
  } catch {
    return null;
  }
}

// List all extracted data
export function listExtractedData(): { key: string; timestamp: number }[] {
  try {
    const stored = JSON.parse(localStorage.getItem('extracted_data') || '{}');
    return Object.entries(stored).map(([key, value]) => ({
      key,
      timestamp: (value as { timestamp: number }).timestamp,
    }));
  } catch {
    return [];
  }
}

// Delete extracted data
export function deleteExtractedData(key: string): void {
  try {
    const stored = JSON.parse(localStorage.getItem('extracted_data') || '{}');
    delete stored[key];
    localStorage.setItem('extracted_data', JSON.stringify(stored));
  } catch {
    console.error('Failed to delete extracted data');
  }
}

// Agent session history
export function saveAgentSession(
  companionId: string,
  goal: string,
  steps: unknown[],
  result: string
): void {
  try {
    const sessions = JSON.parse(localStorage.getItem('agent_sessions') || '[]');
    sessions.unshift({
      id: Date.now().toString(),
      companionId,
      goal,
      steps,
      result,
      timestamp: Date.now(),
    });
    // Keep only last 50 sessions
    if (sessions.length > 50) {
      sessions.length = 50;
    }
    localStorage.setItem('agent_sessions', JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save agent session:', error);
  }
}

// Get agent sessions
export function getAgentSessions(): {
  id: string;
  companionId: string;
  goal: string;
  result: string;
  timestamp: number;
}[] {
  try {
    return JSON.parse(localStorage.getItem('agent_sessions') || '[]');
  } catch {
    return [];
  }
}

// Settings storage
export function saveSetting(key: string, value: string): void {
  localStorage.setItem(`setting_${key}`, value);
}

export function getSetting(key: string): string | null {
  return localStorage.getItem(`setting_${key}`);
}

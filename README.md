# AI Browser

An AI-powered browser with "companions" (AI agents) that can automate web tasks, similar to Strawberry Browser.

## Features

- **Chromium-powered browser** with tab management using Electron BrowserView
- **AI Companions** that can control the browser via Chrome DevTools Protocol (CDP)
- **Vision + DOM understanding** for intelligent page interaction
- **Natural language commands** to instruct companions
- **Approval system** for sensitive actions

## Tech Stack

- **Framework**: Electron 31+ with electron-vite
- **UI**: React 18 + TypeScript + Tailwind CSS
- **AI**: Google Gemini API (@google/generative-ai)
- **Storage**: better-sqlite3 for local data
- **Browser Control**: Chrome DevTools Protocol via webContents.debugger

## Project Structure

```
ai-browser/
├── electron/
│   ├── main.ts                 # Electron main process
│   ├── preload.ts              # IPC bridge (contextBridge)
│   ├── browserManager.ts       # Tab/BrowserView management
│   └── cdp/
│       ├── index.ts            # CDP connection manager
│       ├── actions.ts          # click, type, scroll, navigate
│       └── extraction.ts       # DOM/screenshot capture
├── src/
│   ├── App.tsx                 # Main React app
│   ├── main.tsx                # React entry
│   ├── index.css               # Tailwind styles
│   ├── components/
│   │   ├── BrowserChrome.tsx   # Address bar + tab strip
│   │   ├── Sidebar.tsx         # Companion panel
│   │   ├── CompanionCard.tsx   # Individual companion UI
│   │   ├── CommandInput.tsx    # Natural language input
│   │   ├── ApprovalDialog.tsx  # Action approval modal
│   │   └── SettingsDialog.tsx  # API key settings
│   ├── agents/
│   │   ├── AgentEngine.ts      # Core agent loop
│   │   ├── companions.ts       # Companion definitions
│   │   └── prompts.ts          # System prompts
│   ├── lib/
│   │   ├── llm.ts              # Gemini API wrapper
│   │   ├── ipc.ts              # Renderer IPC helpers
│   │   └── storage.ts          # Local storage helpers
│   └── types/
│       └── index.ts            # TypeScript interfaces
├── package.json
├── electron-builder.json
├── tailwind.config.js
├── tsconfig.json
└── electron.vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key (already configured)

### Installation

1. Install dependencies:
   ```bash
   cd ai-browser
   npm install
   ```

2. The Gemini API key is already configured in the app.

### Development

```bash
npm run dev
```

This starts both the Vite dev server and Electron in development mode.

### Building

```bash
npm run build
```

This builds the app for production.

## Available Companions

1. **Extractor Ella** (📊) - Extracts structured data from pages (emails, links, prices)
2. **Researcher Rex** (🔬) - Researches topics and summarizes findings
3. **Navigator Nancy** (🧭) - Helps navigate complex websites
4. **Filler Frank** (✍️) - Fills out forms automatically (requires approval for submit)
5. **Sales Sally** (👩‍💼) - Finds leads and contact information (requires approval for connections)
6. **Shopper Sam** (🛒) - Compares products and finds deals (requires approval for purchases)

## How It Works

1. **Select a Companion** - Click "Agents" to open the sidebar and choose a companion
2. **Give a Command** - Type a natural language instruction (e.g., "Extract all email addresses from this page")
3. **Watch & Approve** - The agent analyzes the page using vision + DOM, then executes actions
4. **Get Results** - Extracted data or task completion status appears in the sidebar

## Architecture

### Agent Loop

1. Capture screenshot + DOM of current page
2. Send to Gemini with goal + conversation history
3. Parse JSON action from response
4. Check if approval needed for sensitive actions
5. Execute action via CDP (click, type, scroll, etc.)
6. Repeat until done or max steps reached

### CDP Actions

- **click**: Click element by CSS selector
- **type**: Type text into input fields
- **scroll**: Scroll page up/down
- **navigate**: Go to URL
- **extract**: Extract text content
- **wait**: Wait for page load

## License

MIT

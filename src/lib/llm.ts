import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { Message } from '../types';

// Get API key from environment variable (set in .env file as VITE_GEMINI_API_KEY)
const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Debug: Log what we got from env
console.log('ENV_API_KEY from import.meta.env:', ENV_API_KEY ? 'SET (length: ' + ENV_API_KEY.length + ')' : 'NOT SET');

// API key storage - can be overridden via settings
let apiKey: string | null = ENV_API_KEY || null;

// Also try to load from localStorage on init
const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
if (storedKey && !apiKey) {
  apiKey = storedKey;
  console.log('Loaded API key from localStorage');
}

export function setApiKey(key: string): void {
  apiKey = key;
  localStorage.setItem('gemini_api_key', key);
}

export function getApiKey(): string | null {
  // Priority: 1) Runtime set key, 2) localStorage, 3) env variable
  console.log('getApiKey called - current apiKey:', apiKey ? 'SET' : 'NOT SET');

  if (apiKey) return apiKey;

  const stored = localStorage.getItem('gemini_api_key');
  console.log('localStorage gemini_api_key:', stored ? 'SET' : 'NOT SET');

  if (stored) {
    apiKey = stored;
    return stored;
  }

  console.log('ENV_API_KEY fallback:', ENV_API_KEY ? 'SET' : 'NOT SET');
  return ENV_API_KEY || null;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export async function callGemini(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  screenshot?: string
): Promise<string> {
  const key = getApiKey();
  if (!key) {
    throw new Error('API key not set. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
  });

  // Build chat history
  const chatHistory: Content[] = [];

  // Add history
  for (const msg of history) {
    const parts: Part[] = [];

    if (typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    } else {
      for (const block of msg.content) {
        if (block.type === 'text' && block.text) {
          parts.push({ text: block.text });
        } else if (block.type === 'image' && block.source) {
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: block.source.data,
            },
          });
        }
      }
    }

    chatHistory.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts,
    });
  }

  // Build current message parts
  const currentParts: Part[] = [];

  if (screenshot) {
    currentParts.push({
      inlineData: {
        mimeType: 'image/png',
        data: screenshot,
      },
    });
  }

  currentParts.push({ text: userMessage });

  try {
    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(currentParts);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    return text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const callClaude = callGemini;

// Simple chat function for conversational use
export async function chat(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const key = getApiKey();
  if (!key) {
    throw new Error('API key not set. Please add your Gemini API key in Settings.');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
  });

  // Build chat history (all but last message)
  const chatHistory: Content[] = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  // Get the last message
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    throw new Error('No messages provided');
  }

  try {
    const chatSession = model.startChat({
      history: chatHistory,
    });

    const result = await chatSession.sendMessage(lastMessage.content);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    return text;
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw error;
  }
}

// Vision-specific call for screenshot analysis
export async function analyzeScreenshot(
  screenshot: string,
  prompt: string
): Promise<string> {
  const key = getApiKey();
  if (!key) {
    throw new Error('API key not set');
  }

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'image/png',
        data: screenshot,
      },
    },
    { text: prompt },
  ]);

  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('No text response from Gemini');
  }

  return text;
}

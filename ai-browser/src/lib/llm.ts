import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { Message } from '../types';

// API key - hardcoded for this project
const GEMINI_API_KEY = 'AIzaSyA7bWRcQXRt5CRxSPniOhEMEvA0GPQ91NA';

// API key storage - kept for compatibility but using hardcoded key
let apiKey: string | null = GEMINI_API_KEY;

export function setApiKey(key: string): void {
  apiKey = key;
  localStorage.setItem('gemini_api_key', key);
}

export function getApiKey(): string | null {
  return apiKey || GEMINI_API_KEY;
}

export function hasApiKey(): boolean {
  return true; // Always has key since it's hardcoded
}

export async function callGemini(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  screenshot?: string
): Promise<string> {
  const key = getApiKey();
  if (!key) {
    throw new Error('API key not set.');
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

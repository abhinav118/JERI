import Anthropic from '@anthropic-ai/sdk';
import { Message } from '../types';

// API key storage - in production this would be more secure
let apiKey: string | null = null;

export function setApiKey(key: string): void {
  apiKey = key;
  localStorage.setItem('anthropic_api_key', key);
}

export function getApiKey(): string | null {
  if (apiKey) return apiKey;
  apiKey = localStorage.getItem('anthropic_api_key');
  return apiKey;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

type ContentBlockParam = Anthropic.Messages.TextBlockParam | Anthropic.Messages.ImageBlockParam;

export async function callClaude(
  systemPrompt: string,
  history: Message[],
  userMessage: string,
  screenshot?: string
): Promise<string> {
  const key = getApiKey();
  if (!key) {
    throw new Error('API key not set. Please set your Anthropic API key.');
  }

  const client = new Anthropic({
    apiKey: key,
  });

  // Build messages array
  const messages: Anthropic.Messages.MessageParam[] = [];

  // Add history
  for (const msg of history) {
    if (typeof msg.content === 'string') {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    } else {
      // Convert our message format to Anthropic's
      const content: ContentBlockParam[] = msg.content.map((block) => {
        if (block.type === 'text') {
          return { type: 'text' as const, text: block.text || '' };
        } else if (block.type === 'image' && block.source) {
          return {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/png' as const,
              data: block.source.data,
            },
          };
        }
        return { type: 'text' as const, text: '' };
      });
      messages.push({
        role: msg.role,
        content,
      });
    }
  }

  // Add current message with optional screenshot
  const currentContent: ContentBlockParam[] = [];

  if (screenshot) {
    currentContent.push({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/png' as const,
        data: screenshot,
      },
    });
  }

  currentContent.push({
    type: 'text' as const,
    text: userMessage,
  });

  messages.push({
    role: 'user',
    content: currentContent,
  });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      return textBlock.text;
    }

    throw new Error('No text response from Claude');
  } catch (error) {
    console.error('Claude API error:', error);
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

  const client = new Anthropic({
    apiKey: key,
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: 'image/png' as const,
              data: screenshot,
            },
          },
          {
            type: 'text' as const,
            text: prompt,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return textBlock.text;
  }

  throw new Error('No text response from Claude');
}

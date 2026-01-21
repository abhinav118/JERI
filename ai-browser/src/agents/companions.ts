import { Companion } from '../types';
import { PROMPTS } from './prompts';

export const companions: Companion[] = [
  {
    id: 'extractor-ella',
    name: 'Extractor Ella',
    avatar: '📊',
    description: 'Extracts structured data from pages. Great for pulling emails, links, prices, or any repeated information.',
    systemPrompt: PROMPTS.EXTRACTOR,
    approvalRequired: [],
  },
  {
    id: 'researcher-rex',
    name: 'Researcher Rex',
    avatar: '🔬',
    description: 'Researches topics and summarizes findings. Perfect for gathering information across multiple pages.',
    systemPrompt: PROMPTS.RESEARCHER,
    approvalRequired: [],
  },
  {
    id: 'navigator-nancy',
    name: 'Navigator Nancy',
    avatar: '🧭',
    description: 'Helps navigate complex websites and find specific content. Tell her what you\'re looking for.',
    systemPrompt: PROMPTS.NAVIGATOR,
    approvalRequired: [],
  },
  {
    id: 'filler-frank',
    name: 'Filler Frank',
    avatar: '✍️',
    description: 'Fills out forms automatically based on provided information. Great for repetitive form tasks.',
    systemPrompt: PROMPTS.FILLER,
    approvalRequired: ['submit'],
  },
  {
    id: 'sales-sally',
    name: 'Sales Sally',
    avatar: '👩‍💼',
    description: 'Finds leads and extracts contact information. Perfect for prospecting on LinkedIn or company sites.',
    systemPrompt: PROMPTS.SALES,
    approvalRequired: ['send_message', 'connect'],
  },
  {
    id: 'shopper-sam',
    name: 'Shopper Sam',
    avatar: '🛒',
    description: 'Compares products and finds the best deals. Helps with online shopping research.',
    systemPrompt: PROMPTS.SHOPPER,
    approvalRequired: ['checkout', 'add_to_cart'],
  },
];

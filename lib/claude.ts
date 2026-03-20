/**
 * Server-side Claude API integration.
 *
 * The master prompt is read from disk at call time and NEVER transmitted
 * to the browser. The ANTHROPIC_API_KEY is a server-only environment variable.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import type { FormData } from './store';

// Lazy-initialised client — created once per process
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set.');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// Read the master prompt once and cache it
let _masterPrompt: string | null = null;

function getMasterPrompt(): string {
  if (!_masterPrompt) {
    const promptPath = path.join(
      process.cwd(),
      'credit_underwriting_master_prompt_v2.md'
    );
    _masterPrompt = fs.readFileSync(promptPath, 'utf-8');
  }
  return _masterPrompt;
}

function sanitise(value: string): string {
  // Strip any characters that could be used to inject instructions
  return value.replace(/[<>{}[\]\\]/g, '').trim().slice(0, 500);
}

export async function generateCreditReport(data: FormData): Promise<string> {
  const client = getClient();
  const systemPrompt = getMasterPrompt();

  const userMessage = `Please conduct a full credit underwriting assessment using the following buyer details:

- Buyer Country: ${sanitise(data.country)}
- Business Registration Number: ${sanitise(data.regNo)}
- Buyer / Legal Entity Name: ${data.buyerName ? sanitise(data.buyerName) : 'Not provided'}
- Payment Terms: ${sanitise(data.paymentTerms)}
- Requested Credit Limit: USD ${Number(data.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please complete all four sections of the assessment and provide a clear Underwriting Decision at the end.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content.');
  }

  return textBlock.text;
}

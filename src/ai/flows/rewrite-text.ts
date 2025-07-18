import { defineFlow, run } from 'genkit';
import { ai } from '../genkit';
import { z } from 'zod';

export const rewriteText = defineFlow(
  {
    name: 'rewriteText',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      rewrittenText: z.string(),
    }),
  },
  async ({ text }) => {
    const llmResponse = await run('generate-rewritten-text', () =>
      ai.generate({
        model: 'gemini-2.5-flash',
        prompt: `Reescreva o seguinte texto de uma forma mais concisa e profissional: ${text}`,
        temperature: 0.5,
      })
    );
    const rewrittenText = llmResponse.text();
    return { rewrittenText };
  }
);

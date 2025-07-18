import { defineFlow, run } from 'genkit';
import { ai } from '../genkit';
import { z } from 'zod';

export const expandText = defineFlow(
  {
    name: 'expandText',
    inputSchema: z.object({
      text: z.string(),
    }),
    outputSchema: z.object({
      expandedText: z.string(),
    }),
  },
  async ({ text }) => {
    const llmResponse = await run('generate-expanded-text', () =>
      ai.generate({
        model: 'gemini-2.5-flash',
        prompt: `Expanda o seguinte texto, adicionando mais detalhes e explicações: ${text}`,
        temperature: 0.7,
      })
    );
    const expandedText = llmResponse.text();
    return { expandedText };
  }
);

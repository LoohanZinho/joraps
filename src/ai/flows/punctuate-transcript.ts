import { defineFlow, run } from 'genkit';
import { ai } from '../genkit';
import { z } from 'zod';

export const punctuateTranscript = defineFlow(
  {
    name: 'punctuateTranscript',
    inputSchema: z.object({
      transcript: z.string(),
    }),
    outputSchema: z.object({
      punctuatedTranscript: z.string(),
    }),
  },
  async ({ transcript }) => {
    const llmResponse = await run('punctuate-transcript', () =>
      ai.generate({
        model: 'gemini-2.5-flash',
        prompt: `Adicione pontuação à seguinte transcrição: ${transcript}`,
        temperature: 0,
      })
    );
    const punctuatedTranscript = llmResponse.text();
    return { punctuatedTranscript };
  }
);

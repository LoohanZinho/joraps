import { defineFlow, run } from 'genkit';
import { ai } from '../genkit';
import { z } from 'zod';

export const transcribeAudio = defineFlow(
  {
    name: 'transcribeAudio',
    inputSchema: z.object({
      mimeType: z.string(),
      audioData: z.string(),
      noiseSuppression: z.boolean(),
    }),
    outputSchema: z.object({
      transcription: z.string(),
    }),
  },
  async ({ mimeType, audioData, noiseSuppression }) => {
    const prompt = `
      Transcreva o áudio.
      ${noiseSuppression ? 'O áudio pode conter ruído. Tente o seu melhor para transcrevê-lo com precisão.' : ''}
    `;

    const llmResponse = await run('transcribe-audio', () =>
      ai.generate({
        model: 'gemini-2.5-flash',
        prompt,
        input: {
          media: {
            url: `data:${mimeType};base64,${audioData}`,
            contentType: mimeType,
          },
        },
        temperature: 0.2,
      })
    );
    const transcription = llmResponse.text();
    return { transcription };
  }
);

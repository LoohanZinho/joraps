'use server';

/**
 * @fileOverview This file defines a Genkit flow for transcribing audio to text using the Gemini API.
 *
 * - transcribeAudio - A function that takes an audio blob as input and returns the transcribed text.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAudioInputSchema = z.object({
  mimeType: z.string().describe('The MIME type of the audio file.'),
  audioData: z
    .string()
    .describe(
      'The Base64-encoded audio data.'
    ),
  noiseSuppression: z.boolean().describe('Whether to enable noise suppression.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

const transcribeAudioFlow = ai.defineFlow(
  {
    name: 'transcribeAudioFlow',
    inputSchema: TranscribeAudioInputSchema,
    outputSchema: TranscribeAudioOutputSchema,
  },
  async ({ mimeType, audioData, noiseSuppression }) => {
    
    // Validate audio data before making the API call
    if (!audioData || audioData.trim() === '') {
      console.warn('Skipping transcription for empty audio data.');
      return { transcription: '' };
    }

    let promptText = 'Transcreva o seguinte áudio para texto. O áudio está em português do Brasil. Por favor, leve em consideração diferentes sotaques, regionalismos e gírias. Tente corrigir pequenos erros de fala e focar na intenção do que está sendo dito para produzir a transcrição mais clara e precisa possível.';

    if (noiseSuppression) {
      promptText += ' Ignore ruídos de fundo como conversas, cliques ou zumbidos, focando apenas na voz principal.';
    }

    const response = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: [
        { text: promptText },
        { media: { url: `data:${mimeType};base64,${audioData}` } },
      ],
    });
    
    return { transcription: response.text };
  }
);

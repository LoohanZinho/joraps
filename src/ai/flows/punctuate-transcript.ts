'use server';

/**
 * @fileOverview This file defines a Genkit flow for punctuating transcribed text.
 *
 * - punctuateTranscript - A function that takes raw text and returns punctuated text.
 * - PunctuateTranscriptInput - The input type for the punctuateTranscript function.
 * - PunctuateTranscriptOutput - The return type for the punctuateTranscript function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PunctuateTranscriptInputSchema = z.object({
  rawText: z.string().describe('The raw, unpunctuated text to punctuate.'),
});
export type PunctuateTranscriptInput = z.infer<typeof PunctuateTranscriptInputSchema>;

const PunctuateTranscriptOutputSchema = z.object({
  punctuatedText: z.string().describe('The punctuated text.'),
});
export type PunctuateTranscriptOutput = z.infer<typeof PunctuateTranscriptOutputSchema>;

export async function punctuateTranscript(input: PunctuateTranscriptInput): Promise<PunctuateTranscriptOutput> {
  return punctuateTranscriptFlow(input);
}

const punctuateTranscriptPrompt = ai.definePrompt({
  name: 'punctuateTranscriptPrompt',
  input: {schema: PunctuateTranscriptInputSchema},
  output: {schema: PunctuateTranscriptOutputSchema},
  prompt: `Please punctuate the following text to make it more readable and grammatically correct:\n\n{{{rawText}}}`,
});

const punctuateTranscriptFlow = ai.defineFlow(
  {
    name: 'punctuateTranscriptFlow',
    inputSchema: PunctuateTranscriptInputSchema,
    outputSchema: PunctuateTranscriptOutputSchema,
  },
  async input => {
    const {output} = await punctuateTranscriptPrompt(input);
    return output!;
  }
);

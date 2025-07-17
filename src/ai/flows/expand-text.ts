'use server';

/**
 * @fileOverview This file defines a Genkit flow for expanding a given text.
 *
 * - expandText - A function that takes text and returns an expanded, more detailed version.
 * - ExpandTextInput - The input type for the expandText function.
 * - ExpandTextOutput - The return type for the expandText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpandTextInputSchema = z.object({
  text: z.string().describe('The text to expand.'),
});
export type ExpandTextInput = z.infer<typeof ExpandTextInputSchema>;

const ExpandTextOutputSchema = z.object({
  expandedText: z.string().describe('The expanded and more detailed text.'),
});
export type ExpandTextOutput = z.infer<typeof ExpandTextOutputSchema>;

export async function expandText(input: ExpandTextInput): Promise<ExpandTextOutput> {
  return expandTextFlow(input);
}

const expandTextFlow = ai.defineFlow(
  {
    name: 'expandTextFlow',
    inputSchema: ExpandTextInputSchema,
    outputSchema: ExpandTextOutputSchema,
  },
  async ({ text }) => {
    const prompt = `You are an expert content enhancer. Your task is to take the following text and expand upon it, transforming it into a more comprehensive, detailed, and well-structured piece of content. The output must be in Portuguese.

Your expansion should:
1.  **Elaborate on the core subject:** Add depth, provide context, and explain key concepts mentioned in the original text.
2.  **Enrich with details:** Include relevant examples, facts, or illustrative scenarios to make the content more engaging and informative.
3.  **Improve structure and flow:** Organize the information logically. If appropriate, add a brief introduction and a concluding summary.
4.  **Maintain the original intent:** The core message and tone of the original text should be preserved and built upon, not replaced.

Here is the text to expand:
${text}`;

    const {output} = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: prompt,
        output: { schema: ExpandTextOutputSchema },
    });
    return output!;
  }
);

'use server';

/**
 * @fileOverview This file defines a Genkit flow for rewriting a given text.
 *
 * - rewriteText - A function that takes text and returns a rewritten, more formal version.
 * - RewriteTextInput - The input type for the rewriteText function.
 * - RewriteTextOutput - The return type for the rewriteText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RewriteTextInputSchema = z.object({
  text: z.string().describe('The text to rewrite.'),
});
export type RewriteTextInput = z.infer<typeof RewriteTextInputSchema>;

const RewriteTextOutputSchema = z.object({
  rewrittenText: z.string().describe('The rewritten and more formal text.'),
});
export type RewriteTextOutput = z.infer<typeof RewriteTextOutputSchema>;

export async function rewriteText(input: RewriteTextInput): Promise<RewriteTextOutput> {
  return rewriteTextFlow(input);
}

const rewriteTextFlow = ai.defineFlow(
  {
    name: 'rewriteTextFlow',
    inputSchema: RewriteTextInputSchema,
    outputSchema: RewriteTextOutputSchema,
  },
  async ({ text }) => {
    const prompt = `Você é um especialista em criação e estruturação de conteúdo. Sua tarefa é pegar o texto fornecido, que representa um assunto, e detalhá-lo em uma estrutura de tópicos clara e organizada.

Sua resposta deve:
1.  **Manter o Assunto Principal:** Comece a resposta com o assunto original.
2.  **Criar Tópicos Detalhados:** Desenvolva o assunto em vários tópicos numerados (Tópico 1, Tópico 2, etc.).
3.  **Adicionar Pontos-Chave:** Dentro de cada tópico, use bullet points (-) para listar os pontos, detalhes e explicações mais importantes.
4.  **Ser Detalhado:** Forneça informações aprofundadas e relevantes para cada ponto.
5.  **Idioma:** A saída final deve ser inteiramente em português do Brasil.

Exemplo de formato esperado:

[Assunto Original]

Tópico 1: [Nome do Primeiro Tópico]
- [Ponto chave ou detalhe sobre o tópico 1]
- [Outro ponto chave sobre o tópico 1]

Tópico 2: [Nome do Segundo Tópico]
- [Ponto chave ou detalhe sobre o tópico 2]
- [Outro ponto chave sobre o tópico 2]

---

Aqui está o texto/assunto para detalhar:
${text}`;

    const {output} = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: prompt,
        output: { schema: RewriteTextOutputSchema, key: 'rewrittenText' },
    });
    return output!;
  }
);

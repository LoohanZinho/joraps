// src/ai/client.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Pega a chave de API diretamente das variáveis de ambiente do Next.js
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error('A chave de API do Google não está definida. Verifique o seu arquivo .env.local.');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Configurações de segurança para serem menos restritivas
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  safetySettings,
});

// Função de Transcrição
export async function transcribeAudio(mimeType: string, audioData: string, noiseSuppression: boolean) {
  const prompt = `
    Seu papel é ser um serviço de transcrição de áudio. Você receberá um áudio e deve retornar APENAS o texto transcrito.
    Não adicione comentários, desculpas ou qualquer texto extra. Apenas a transcrição.
    ${noiseSuppression ? 'O áudio pode conter ruído de fundo; faça o seu melhor para transcrevê-lo com precisão.' : ''}
  `;
  const audioPart = {
    inlineData: {
      data: audioData,
      mimeType,
    },
  };
  const result = await model.generateContent([prompt, audioPart]);
  return { transcription: result.response.text() };
}

// Função de Expansão
export async function expandText(text: string) {
  const prompt = `Expanda o seguinte texto, adicionando mais detalhes e explicações: ${text}`;
  const result = await model.generateContent(prompt);
  return { expandedText: result.response.text() };
}

// Função de Reescrita
export async function rewriteText(text: string) {
  const prompt = `Reescreva o seguinte texto de uma forma mais concisa e profissional: ${text}`;
  const result = await model.generateContent(prompt);
  return { rewrittenText: result.response.text() };
}

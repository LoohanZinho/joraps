
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

const transcriptionModels = ['gemini-1.5-flash', 'gemini-1.5-pro'];
const mainModelName = 'gemini-1.5-flash';

const mainModel = genAI.getGenerativeModel({
  model: mainModelName,
  safetySettings,
});

// Função de Transcrição com Fallback
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

  let lastError: unknown = null;

  for (const modelName of transcriptionModels) {
    try {
      console.log(`Tentando transcrever com o modelo: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
      });
      const result = await model.generateContent([prompt, audioPart]);
      const transcription = result.response.text();
      console.log(`Transcrição bem-sucedida com o modelo: ${modelName}`);
      return { transcription };
    } catch (e) {
      console.error(`Falha ao transcrever com o modelo ${modelName}:`, e);
      lastError = e;
    }
  }

  console.error("Todos os modelos de transcrição falharam.");
  throw lastError; // Lança o último erro se todos os modelos falharem
}


// Função de Expansão
export async function expandText(text: string) {
  const prompt = `Expanda o seguinte texto, adicionando mais detalhes e explicações: ${text}`;
  const result = await mainModel.generateContent(prompt);
  return { expandedText: result.response.text() };
}

// Função de Reescrita
export async function rewriteText(text: string) {
  const prompt = `Reescreva o seguinte texto de uma forma mais concisa e profissional: ${text}`;
  const result = await mainModel.generateContent(prompt);
  return { rewrittenText: result.response.text() };
}

// Função para extrair texto de um PDF
export async function extractTextFromPDF(file: File) {
    // Importação dinâmica para garantir que seja executado apenas no cliente
    const pdfjs = await import('pdfjs-dist/build/pdf');
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({data: arrayBuffer}).promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }

    return { extractedText: fullText };
}


// Função de Chat sobre o conteúdo
export async function chatAboutContent(transcript: string, history: Array<{ sender: 'user' | 'bot'; text: string }>, question: string) {
    const formattedHistory = history.map(msg => `${msg.sender === 'user' ? 'Usuário' : 'Assistente'}: ${msg.text}`).join('\n');

    const prompt = `
    Você é um assistente de IA amigável e prestativo. Sua principal função é responder a perguntas com base no conteúdo de uma transcrição fornecida.
    Você deve ter uma conversa natural e fluida. Use o histórico da conversa para entender o contexto.
    Baseie suas respostas estritamente no texto da transcrição. Se a informação não estiver explicitamente no texto, você pode tentar inferir ou educadamente dizer que não consegue encontrar a resposta, mas evite ser robótico.

    **Transcrição Completa:**
    """
    ${transcript}
    """

    **Histórico da Conversa:**
    ${formattedHistory}

    **Nova Pergunta do Usuário:** "${question}"

    **Sua Resposta (como Assistente):**
  `;
  const result = await mainModel.generateContent(prompt);
  return { answer: result.response.text() };
}

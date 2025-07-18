import { transcribeAudio } from './flows/transcribe-audio';
import { expandText } from './flows/expand-text';
import { rewriteText } from './flows/rewrite-text';

// Esta função centraliza a lógica de IA, garantindo que os fluxos sejam importados corretamente.
export async function handleAiAction(action: string, payload: any) {
  switch (action) {
    case 'transcribe':
      // O 'payload' já contém os argumentos necessários para o fluxo.
      return await transcribeAudio(payload);
    case 'expand':
      return await expandText(payload);
    case 'rewrite':
      return await rewriteText(payload);
    default:
      throw new Error(`Ação de IA desconhecida: ${action}`);
  }
}

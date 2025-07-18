import { NextRequest, NextResponse } from 'next/server';
import { handleAiAction } from '@/ai/handler';

export async function POST(req: NextRequest) {
  try {
    const { action, payload } = await req.json();
    
    // Delega a execução da ação para o manipulador central.
    const result = await handleAiAction(action, payload);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('API AI Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Um erro desconhecido ocorreu';
    return NextResponse.json({ error: 'Erro interno do servidor', details: errorMessage }, { status: 500 });
  }
}

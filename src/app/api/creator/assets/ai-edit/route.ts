import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getAiClient, getTextModel } from '@/lib/ai/genai.client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    try {
      await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { action, text, context } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Falta el texto a editar' }, { status: 400 });
    }

    let instruction = "";

    switch(action) {
      case "improve":
        instruction = "Mejora la redacción y gramática del texto, haciéndolo más profesional y claro. Manten la longitud similar.";
        break;
      case "expand":
        instruction = "Expande el siguiente texto aportando más detalles, ejemplos útiles, o un pequeño párrafo adicional. Manten el mismo tono.";
        break;
      case "summarize":
        instruction = "Resume este texto en los puntos más importantes de forma concisa.";
        break;
      case "empathize":
        instruction = "Reescribe el texto utilizando un tono más empático, cálido y comprensivo, ideal para terapeutas y creadores holísticos comunicándose con sus alumnos.";
        break;
      default:
        instruction = "Mejora el texto proporcionado.";
    }

    const prompt = `
      Has sido configurado como Nano Banana, un asistente experto de edición para creadores de cursos y terapeutas.
      Instrucción: ${instruction}
      
      Texto Original:
      """
      ${text}
      """
      
      Devuelve SOLAMENTE el texto modificado usando la misma sintaxis (Markdown si lo había) sin comillas, introducciones ni saludos.
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: await getTextModel(),
      contents: [{ text: prompt }],
      config: { temperature: 0.7 } as any
    });

    const modifiedText = response.text;

    return NextResponse.json({ 
      success: true, 
      text: modifiedText?.trim()
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in Assistive AI Edit:', error);
    return NextResponse.json({ error: 'Error editando el texto con IA', details: error.message }, { status: 500 });
  }
}

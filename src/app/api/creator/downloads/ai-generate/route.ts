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

    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Ingresa de qué quieres que trate el documento' }, { status: 400 });
    }

    const systemInstruction = `
      Eres Nano Banana, el editor en jefe y generador experto de Lead Magnets para educadores y terapeutas (Psicología, Holístico, Bienestar).
      Tu objetivo es generar una guía, eBook, o plantilla de alta calidad basada en el prompt del usuario.
      El resultado DEBE estar en formato Markdown enriquecido (sin saludar, sin introducciones conversacionales).
      Usa títulos (#, ##, ###), listas, blockquotes (>) para citas o tips importantes, y tablas si es necesario.
      Debe sentirse ultra-premium, accionable y directo.
      
      IMPORTANTE: No uses etiquetas html como \`\`\`markdown, solo el contenido puro en Markdown.
    `;

    const enhancedPrompt = `
      Genera el contenido de una descarga digital (Lead Magnet o Plantilla) sobre el siguiente tema o requerimiento: "${prompt}".
      Hazlo con una estructura clara:
      1. Título principal atractivo de la guía/descarga
      2. Una breve introducción persuasiva
      3. El cuerpo o estructura principal (ejercicios, días de plantillas, o checklist)
      4. Una conclusión cálida recomendando el siguiente paso.
    `;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: await getTextModel(),
      contents: [{ text: enhancedPrompt }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      } as any
    });

    const generatedMarkdown = response.text;

    return NextResponse.json({ 
      success: true, 
      markdown: generatedMarkdown 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error generating AI Download:', error);
    return NextResponse.json({ error: 'Error generando tu Documento Mágico', details: error.message }, { status: 500 });
  }
}

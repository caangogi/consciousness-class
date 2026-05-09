require('dotenv').config({ path: '.env' });
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({});

async function listModels() {
  try {
    const response = await ai.models.list();
    console.log("=== Available Models ===");
    for await (const model of response) {
      console.log(`- ${model.name}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Supported Generation Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();

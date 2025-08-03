import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client with fallback for both possible API key names
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

export interface ProductData {
  categoria: string;
  titulo: string;
  autor?: string;
  marca?: string;
  descripcion?: string;
}

/**
 * Convert image to base64 string
 */
function imageToBase64(imagePath: string): string {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

/**
 * Analyze a product image using Claude AI
 */
export async function analyzeProductImage(imagePath: string): Promise<ProductData> {
  try {
    const base64Image = imageToBase64(imagePath);
    const imageExtension = path.extname(imagePath).toLowerCase();
    const mimeType = imageExtension === '.png' ? 'image/png' : 'image/jpeg';

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analiza esta imagen de producto y extrae la siguiente información en formato JSON:
              {
                "categoria": "tipo específico del producto en español (ej: cd, vinilo, libro, dvd, blu-ray, videojuego, celular, notebook, zapatillas, remera, etc.)",
                "titulo": "título del producto",
                "autor": "nombre del autor (si es libro/música)",
                "marca": "nombre de la marca si es visible",
                "descripcion": "descripción breve del producto"
              }
              
              Para la categoría, usa el tipo específico que la gente buscaría en MercadoLibre Argentina, no categorías genéricas. Por ejemplo:
              - CD (no "música")
              - Vinilo (no "música") 
              - Libro (no "literatura")
              - DVD o Blu-ray (no "película")
              - Celular o Smartphone (no "electrónica")
              
              Responde SOLAMENTE en español. Si no puedes determinar un campo, usa null.`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Extract JSON from the response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const productData = JSON.parse(jsonMatch[0]);
        return productData;
      }
    }
    
    throw new Error('Could not extract product data from response');
  } catch (error) {
    console.error('Error analyzing product image:', error);
    throw error;
  }
}

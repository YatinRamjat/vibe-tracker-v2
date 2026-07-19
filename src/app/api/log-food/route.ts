import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, imageBase64 } = body;

    if (!query && !imageBase64) {
      return NextResponse.json({ error: 'Missing query or image' }, { status: 400 });
    }

    try {
      // 1. Internal Cloud Lookup (only for text queries)
      if (query && !imageBase64) {
        const { data: cacheData, error: cacheError } = await supabase
          .from('global_food_cache')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(1)
          .single();

        if (cacheData && !cacheError) {
          return NextResponse.json({
            source: 'cache',
            data: cacheData
          });
        }
      }
    } catch (cacheLookupError: any) {
      console.error('Cache lookup failed. Proceeding to AI fallback.', cacheLookupError);
    }

    try {
      // 2. External AI Synthesis
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const systemInstruction = `Analyze the food query text or product image. Deconstruct the recipe entirely into its underlying core constituent parts by raw weight mass grams. Calculate accurate total values for Calories, Protein, Carbs, and Fat, alongside exact micro-nutrient specifications for Fiber, Sodium, Potassium, Calcium, and Iron. Return ONLY a single raw valid JSON data object matching this schema format with no markdown block ticks or textual prose commentary:
{
  "foodName": string,
  "isComplexDish": boolean,
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "fiber": number,
  "sodium": number,
  "potassium": number,
  "calcium": number,
  "iron": number,
  "ingredients": Array<{ name: string, weightGrams: number, calories: number, protein: number, carbs: number, fat: number }>
}`;

      const promptParts: any[] = [{ text: systemInstruction }];

      if (query) {
        promptParts.push({ text: `\nQuery: ${query}` });
      }

      if (imageBase64) {
        // Assuming imageBase64 is a base64 string without the data URL prefix
        promptParts.push({
          inlineData: {
            data: imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ''),
            mimeType: imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
          }
        });
      }

      const result = await model.generateContent(promptParts);
      let responseText = result.response.text();

      // Clean up potential markdown from the response robustly
      responseText = responseText.replace(/```(?:json)?\n?|\n?```/g, '').trim();
      responseText = responseText.replace(/^\s+|\s+$/g, ''); // strip hidden whitespace

      let geminiData;
      try {
        geminiData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON response:', parseError, '\nRaw text:', responseText);
        return NextResponse.json({ error: 'AI returned invalid data format. Please try again.' }, { status: 500 });
      }

      // Save newly generated data to cache
      const { data: insertedData, error: insertError } = await supabase
        .from('global_food_cache')
        .insert({
          name: geminiData.foodName,
          is_complex_dish: geminiData.isComplexDish,
          total_calories: geminiData.totalCalories,
          total_protein: geminiData.totalProtein,
          total_carbs: geminiData.totalCarbs,
          total_fat: geminiData.totalFat,
          fiber: geminiData.fiber,
          sodium: geminiData.sodium,
          potassium: geminiData.potassium,
          calcium: geminiData.calcium,
          iron: geminiData.iron,
          ingredients: geminiData.ingredients
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to insert into cache:', insertError);
      }

      return NextResponse.json({
        source: 'gemini',
        data: insertedData || geminiData // Fallback to raw gemini data if insert fails but we still want to return
      });

    } catch (aiError: any) {
      console.error('AI Processing Error:', aiError);
      return NextResponse.json({ error: 'Failed to analyze food. The AI service may be down.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Route Fatal Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}

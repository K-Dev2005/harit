import { GoogleGenerativeAI } from '@google/generative-ai';
import { EMISSION_FACTORS } from '../../lib/emissionFactors';

const apiKey = process.env.GEMINI_API_KEY || 'dummy_key_for_testing';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const parseEntryText = async (text: string) => {
  const prompt = `
  You are a carbon emissions parser for an Indian audience.
  The user has described an activity in plain text. Extract:
  - activity_type: one of transport/food/home/shopping/other
  - mode: specific subcategory (e.g. 'petrol cab', 'metro', 'non-veg meal', 'AC usage')
  - quantity: numeric value
  - unit: km / meals / kWh / hours / items
  - co2_kg: calculated emission using these factors:
    ${JSON.stringify(EMISSION_FACTORS)}
  - needs_clarification: true if the input is too vague
  - clarification_question: a short question if clarification needed
  Return only valid JSON. No preamble, no markdown.
  
  User Input: "${text}"
  `;

  try {
    const result = await model.generateContent(prompt);
    let textResult = result.response.text();
    // Strip markdown if mistakenly added
    if (textResult.startsWith('```json')) {
      textResult = textResult.substring(7, textResult.length - 3);
    }
    const parsed = JSON.parse(textResult.trim());
    console.log(`[Gemini API] Parsed entry. Tokens used: ${result.response.usageMetadata?.totalTokenCount}`);
    return parsed;
  } catch (error) {
    console.error('Error calling Gemini for parse:', error);
    throw new Error('Failed to parse entry text');
  }
};

export const generateActionCards = async (historyData: any) => {
  const prompt = `
  You are a carbon reduction advisor for Indian users.
  Given this user's last 4 weeks of emissions by category:
  ${JSON.stringify(historyData)}
  Generate exactly 3 action cards ranked by this score:
  (emission_impact_kg × ease_score) ÷ lifestyle_disruption
  where ease_score and lifestyle_disruption are 1–5 scales.
  Each card: { "headline": "max 8 words, imperative", "category": "transport|food|home|shopping", "estimatedWeeklySavingKg": number, "metaphor": "short phrase", "actionDetail": "one sentence" }
  Be specific to this user's patterns. If they never fly, don't suggest flight actions. Return only JSON array. No preamble, no markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    let textResult = result.response.text();
    if (textResult.startsWith('```json')) {
      textResult = textResult.substring(7, textResult.length - 3);
    }
    const parsed = JSON.parse(textResult.trim());
    console.log(`[Gemini API] Generated actions. Tokens used: ${result.response.usageMetadata?.totalTokenCount}`);
    return parsed;
  } catch (error) {
    console.error('Error calling Gemini for actions:', error);
    return []; // Return empty cards on error to fail gracefully
  }
};

export const generateWeeklyInsight = async (weeklyData: any) => {
  const prompt = `
  In one sentence (max 20 words), give a specific, encouraging insight about this user's carbon week.
  Reference actual numbers or behaviors from the data.
  Data: ${JSON.stringify(weeklyData)}. Return only the sentence, no quotes.
  `;

  try {
    const result = await model.generateContent(prompt);
    const textResult = result.response.text().trim();
    console.log(`[Gemini API] Generated insight. Tokens used: ${result.response.usageMetadata?.totalTokenCount}`);
    return textResult;
  } catch (error) {
    console.error('Error calling Gemini for insights:', error);
    return "Great job tracking your emissions this week!";
  }
};

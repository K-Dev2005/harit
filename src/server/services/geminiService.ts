import { GoogleGenerativeAI } from '@google/generative-ai';
import { EMISSION_FACTORS } from '../../lib/emissionFactors';

const apiKey = process.env.GEMINI_API_KEY || '';
const hasValidKey = apiKey && apiKey !== 'dummy_key_for_testing' && apiKey.length > 10;

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

if (hasValidKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

/** Strip markdown code-fence wrappers that Gemini sometimes adds */
function stripMarkdown(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
}

/**
 * Simple rule-based mock parser used when no valid Gemini API key is present.
 * Handles the most common Indian-urban patterns so devs can test the UI flow.
 */
function mockParse(text: string): Record<string, any> {
  const lower = text.toLowerCase();

  // --- Transport ---
  const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*km/i);
  const km = kmMatch ? parseFloat(kmMatch[1]) : 10;

  if (/(uber|ola|cab|auto|taxi|rapido)/i.test(lower)) {
    return {
      activity_type: 'transport',
      mode: 'petrol cab',
      quantity: km,
      unit: 'km',
      co2_kg: parseFloat((km * (EMISSION_FACTORS['ola'] || 0.21)).toFixed(2)),
      needs_clarification: false,
    };
  }
  if (/(metro|bus|local train)/i.test(lower)) {
    return {
      activity_type: 'transport',
      mode: lower.includes('metro') ? 'metro' : 'bus',
      quantity: km,
      unit: 'km',
      co2_kg: parseFloat((km * (EMISSION_FACTORS['metro'] || 0.04)).toFixed(2)),
      needs_clarification: false,
    };
  }
  if (/(car|drove|drive|petrol|diesel)/i.test(lower)) {
    return {
      activity_type: 'transport',
      mode: 'personal petrol car',
      quantity: km,
      unit: 'km',
      co2_kg: parseFloat((km * (EMISSION_FACTORS['personal petrol car'] || 0.21)).toFixed(2)),
      needs_clarification: false,
    };
  }
  if (/(flight|flew|plane|air india|indigo|spicejet)/i.test(lower)) {
    return {
      activity_type: 'transport',
      mode: 'flight (economy)',
      quantity: km,
      unit: 'km',
      co2_kg: parseFloat((km * (EMISSION_FACTORS['flight (economy)'] || 0.255)).toFixed(2)),
      needs_clarification: false,
    };
  }

  // --- Food ---
  if (/(swiggy|zomato|order|food|meal|biryani|pizza|burger|chicken|mutton|non.?veg)/i.test(lower)) {
    const meals = text.match(/(\d+)\s*meal/i)?.[1];
    const qty = meals ? parseInt(meals) : 1;
    const isNonVeg = /(chicken|mutton|fish|non.?veg|biryani)/i.test(lower);
    const factor = isNonVeg ? (EMISSION_FACTORS['non-veg meal'] || 3.3) : (EMISSION_FACTORS['veg meal'] || 0.9);
    return {
      activity_type: 'food',
      mode: isNonVeg ? 'non-veg meal' : 'veg meal',
      quantity: qty,
      unit: 'meals',
      co2_kg: parseFloat((qty * factor).toFixed(2)),
      needs_clarification: false,
    };
  }

  // --- Home ---
  if (/(ac|air con|geyser|appliance|electricity|kWh)/i.test(lower)) {
    const hrs = text.match(/(\d+(?:\.\d+)?)\s*h/i)?.[1];
    const qty = hrs ? parseFloat(hrs) : 2;
    return {
      activity_type: 'home',
      mode: 'AC usage',
      quantity: qty,
      unit: 'hours',
      co2_kg: parseFloat((qty * (EMISSION_FACTORS['ac usage - 1 hr'] || 0.8)).toFixed(2)),
      needs_clarification: false,
    };
  }

  // --- Fallback: needs clarification ---
  return {
    activity_type: 'other',
    mode: 'general',
    quantity: 1,
    unit: 'items',
    co2_kg: 0,
    needs_clarification: true,
    clarification_question: "Could you be more specific? For example, mention the transport mode or food type and distance/quantity.",
  };
}

export const parseEntryText = async (text: string) => {
  // Use mock parser when no valid Gemini key
  if (!hasValidKey || !model) {
    console.warn('[Gemini] No valid API key found — using mock parser.');
    return mockParse(text);
  }

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

Return ONLY valid JSON. No preamble, no markdown, no code fences.

User Input: "${text}"
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleaned = stripMarkdown(rawText);
    const parsed = JSON.parse(cleaned);
    console.log(`[Gemini API] Parsed entry. Tokens: ${result.response.usageMetadata?.totalTokenCount}`);
    return parsed;
  } catch (error) {
    console.error('[Gemini] Parse failed, falling back to mock:', error);
    // Graceful fallback so the frontend still works
    return mockParse(text);
  }
};

export const generateActionCards = async (historyData: any) => {
  if (!hasValidKey || !model) {
    console.warn('[Gemini] No valid API key — returning mock action cards.');
    return [
      { headline: 'Switch to metro for daily commute', category: 'transport', estimatedWeeklySavingKg: 4.2, metaphor: 'saves 1 tree/month', actionDetail: 'Metro emits 5× less CO₂ than a cab for the same distance.' },
      { headline: 'Skip one non-veg meal this week', category: 'food', estimatedWeeklySavingKg: 3.3, metaphor: '≈ 8 km of driving', actionDetail: 'Replacing non-veg with a dal-rice meal cuts emissions by 75%.' },
      { headline: 'Reduce AC by 1 hour daily', category: 'home', estimatedWeeklySavingKg: 5.6, metaphor: 'powers a phone for a year', actionDetail: 'Setting AC to 26°C and reducing usage saves significant electricity.' },
    ];
  }

  const prompt = `
You are a carbon reduction advisor for Indian users.
Given this user's last 4 weeks of emissions by category:
${JSON.stringify(historyData)}
Generate exactly 3 action cards ranked by this score:
(emission_impact_kg × ease_score) ÷ lifestyle_disruption
where ease_score and lifestyle_disruption are 1–5 scales.
Each card: { "headline": "max 8 words, imperative", "category": "transport|food|home|shopping", "estimatedWeeklySavingKg": number, "metaphor": "short phrase", "actionDetail": "one sentence" }
Be specific to this user's patterns. If they never fly, don't suggest flight actions. Return only JSON array. No preamble, no markdown.
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleaned = stripMarkdown(rawText);
    const parsed = JSON.parse(cleaned);
    console.log(`[Gemini API] Generated actions. Tokens: ${result.response.usageMetadata?.totalTokenCount}`);
    return parsed;
  } catch (error) {
    console.error('[Gemini] Action card generation failed:', error);
    return [];
  }
};

export const generateWeeklyInsight = async (weeklyData: any) => {
  if (!hasValidKey || !model) {
    return 'Great job tracking your emissions this week! Keep it up.';
  }

  const prompt = `
In one sentence (max 20 words), give a specific, encouraging insight about this user's carbon week.
Reference actual numbers or behaviors from the data.
Data: ${JSON.stringify(weeklyData)}. Return only the sentence, no quotes.
  `.trim();

  try {
    const result = await model.generateContent(prompt);
    const textResult = result.response.text().trim();
    console.log(`[Gemini API] Generated insight. Tokens: ${result.response.usageMetadata?.totalTokenCount}`);
    return textResult;
  } catch (error) {
    console.error('[Gemini] Weekly insight failed:', error);
    return 'Great job tracking your emissions this week!';
  }
};

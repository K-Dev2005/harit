import { getAuthUserId } from './auth';

export interface ParseResult {
  needs_clarification: boolean;
  clarification_question: string;
  entry: {
    userId: string;
    category: string;
    subcategory: string;
    description: string;
    distanceKm?: number;
    quantity?: number;
    unit: string;
    co2Kg: number;
    source: string;
    rawInput: string;
  };
}

/** Lightweight client-side parser used when the backend is unreachable */
export function clientSideMock(text: string) {
  const lower = text.toLowerCase();
  const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*km/i);
  const km = kmMatch ? parseFloat(kmMatch[1]) : 10;

  if (/(uber|ola|cab|auto|taxi|rapido)/i.test(lower)) {
    return { activity_type: 'transport', mode: 'petrol cab', quantity: km, unit: 'km', co2_kg: parseFloat((km * 0.21).toFixed(2)), needs_clarification: false };
  }
  if (/(metro|bus)/i.test(lower)) {
    return { activity_type: 'transport', mode: 'metro', quantity: km, unit: 'km', co2_kg: parseFloat((km * 0.022).toFixed(2)), needs_clarification: false };
  }
  if (/(car|drove|drive|petrol|diesel)/i.test(lower)) {
    return { activity_type: 'transport', mode: 'personal car', quantity: km, unit: 'km', co2_kg: parseFloat((km * 0.21).toFixed(2)), needs_clarification: false };
  }
  if (/(flight|flew|plane)/i.test(lower)) {
    return { activity_type: 'transport', mode: 'flight (economy)', quantity: km, unit: 'km', co2_kg: parseFloat((km * 0.485).toFixed(2)), needs_clarification: false };
  }
  if (/(swiggy|zomato|order|biryani|chicken|mutton|non.?veg)/i.test(lower)) {
    return { activity_type: 'food', mode: 'non-veg meal', quantity: 1, unit: 'meals', co2_kg: 3.0, needs_clarification: false };
  }
  if (/(food|meal|lunch|dinner|veg)/i.test(lower)) {
    return { activity_type: 'food', mode: 'veg meal', quantity: 1, unit: 'meals', co2_kg: 1.2, needs_clarification: false };
  }
  if (/(ac|air con|geyser|electricity)/i.test(lower)) {
    return { activity_type: 'home', mode: 'AC usage', quantity: 2, unit: 'hours', co2_kg: 1.6, needs_clarification: false };
  }
  return {
    activity_type: 'other', mode: 'general', quantity: 1, unit: 'items', co2_kg: 0,
    needs_clarification: true,
    clarification_question: "Could you be more specific? Mention the transport mode or food type and a distance or quantity.",
  };
}

export function normalizeToParseResult(data: any, inputText: string): ParseResult {
  // If the backend already wrapped it in {needs_clarification, entry} shape, use that
  if (data.entry) return data;

  // Otherwise, build the entry object from raw Gemini fields
  const isTransport = (data.activity_type || data.category || '').toLowerCase() === 'transport';
  const qty = data.quantity || 0;
  const entryObj = {
    userId: getAuthUserId(),
    category: data.activity_type || data.category || 'transport',
    subcategory: data.mode || data.subcategory || 'general',
    description: inputText,
    distanceKm: isTransport ? Number(qty) : undefined,
    quantity: !isTransport ? Number(qty) : undefined,
    unit: data.unit || (isTransport ? 'km' : 'items'),
    co2Kg: Number(data.co2_kg !== undefined ? data.co2_kg : (data.co2Kg !== undefined ? data.co2Kg : 0)),
    source: 'ai',
    rawInput: inputText,
  };

  return {
    needs_clarification: !!data.needs_clarification,
    clarification_question: data.clarification_question || "",
    entry: entryObj,
  };
}

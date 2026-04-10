import { GoogleGenAI } from "@google/genai";

export const getTaxAdvice = async (query: string, apiKey?: string): Promise<string> => {
  try {
    const key = apiKey || process.env.API_KEY || '';
    if (!key) {
      return "Gemini API key is not configured. Please set it in Admin Settings.";
    }
    const ai = new GoogleGenAI({ apiKey: key });
    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: `You are an expert Indian Tax Consultant specializing in TDS (Tax Deducted at Source). 
      Provide a concise, accurate answer to the user's query regarding TDS rates, sections, or compliance. 
      Keep it professional and helpful. Query: ${query}`,
    });
    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to connect to the Tax Assistant service. Please check your network or API key.";
  }
};
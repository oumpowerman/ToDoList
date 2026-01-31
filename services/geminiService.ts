import { GoogleGenAI, Type } from "@google/genai";
import { Priority, AIResponse } from "../types";

// ⚠️ ใส่ Gemini API Key ตรงนี้ (เอาจาก aistudio.google.com)
const apiKey = "YOUR_GEMINI_API_KEY_HERE";

const ai = (apiKey && !apiKey.includes("YOUR_GEMINI")) ? new GoogleGenAI({ apiKey }) : null;

export const generateTaskBreakdown = async (taskTitle: string): Promise<AIResponse | null> => {
  if (!ai) {
    console.error("API Key missing");
    return null;
  }

  try {
    const model = "gemini-2.0-flash"; // Updated to newer model if available or stick to stable
    const currentDate = new Date().toISOString();
    
    const prompt = `Current date and time is ${currentDate}. Analyze this task: "${taskTitle}".
    IMPORTANT: Respond in Thai Language (ภาษาไทย).
    
    1. Break it down into 3-6 actionable subtasks.
    2. Suggest a priority (Low, Medium, High).
    3. Suggest 1-3 short tags.
    4. EXTRACT DATE & TIME: 
       - If the user implies a time (e.g., "นัดคุณส้ม 11 โมง", "พรุ่งนี้บ่าย 2"), convert it to an exact ISO 8601 date string.
       - If no date specified but time is given, assume Today or Tomorrow.
       - If absolutely no time mentioned, return null for suggestedDueDate.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedPriority: { type: Type.STRING, enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH] },
            suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedDueDate: { type: Type.STRING }
          },
          required: ["subtasks", "suggestedPriority", "suggestedTags"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("Error generating task breakdown:", error);
    return null;
  }
};
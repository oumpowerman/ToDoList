import { GoogleGenAI, Type } from "@google/genai";
import { Priority, AIResponse } from "../types";

const apiKey = process.env.API_KEY;

// Initialize conditionally
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateTaskBreakdown = async (taskTitle: string): Promise<AIResponse | null> => {
  if (!ai) {
    console.error("API Key missing");
    return null;
  }

  try {
    const model = "gemini-3-flash-preview";
    const currentDate = new Date().toISOString();
    
    // Enhanced Prompt for Thai Date/Time Parsing
    const prompt = `Current date and time is ${currentDate}. Analyze this task: "${taskTitle}".
    IMPORTANT: Respond in Thai Language (ภาษาไทย).
    
    1. Break it down into 3-6 actionable subtasks.
    2. Suggest a priority (Low, Medium, High).
    3. Suggest 1-3 short tags.
    4. EXTRACT DATE & TIME: 
       - If the user implies a time (e.g., "นัดคุณส้ม 11 โมง", "พรุ่งนี้บ่าย 2", "Meet at 10am"), convert it to an exact ISO 8601 date string.
       - Logic: "11 โมง" means 11:00 AM. "บ่าย 2" means 14:00. "เย็น" implies around 17:00 or 18:00.
       - If no date specified but time is given, assume Today (if time is in future) or Tomorrow.
       - If absolutely no time mentioned, return null for suggestedDueDate.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "รายการงานย่อย ภาษาไทย"
            },
            suggestedPriority: {
              type: Type.STRING,
              enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH],
              description: "ความสำคัญ"
            },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "แท็กที่เกี่ยวข้อง"
            },
            suggestedDueDate: {
              type: Type.STRING,
              description: "ISO 8601 date string (e.g. 2023-12-31T14:00:00.000Z)"
            }
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
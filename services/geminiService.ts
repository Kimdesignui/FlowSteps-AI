import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeScreenshot = async (base64Image: string): Promise<{ title: string; description: string }> => {
  try {
    const ai = getClient();
    // Remove header if present (data:image/png;base64,)
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: cleanBase64,
            },
          },
          {
            text: "Analyze this UI screenshot for a user guide. \n1. Title: Create a short, action-oriented title starting with a verb (e.g., 'Click the Submit Button'). \n2. Description: Write a clear instruction explaining exactly what the user should do in this step and why. Keep it helpful for a manual.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
          },
          required: ["title", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) return { title: "New Step", description: "Add description here." };

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      title: "Step Captured",
      description: "Could not automatically analyze image. Please add details manually.",
    };
  }
};

export const generateStepDescription = async (base64Image: string, currentTitle: string, currentDescription: string): Promise<string> => {
    try {
        const ai = getClient();
        const cleanBase64 = base64Image.split(',')[1] || base64Image;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: cleanBase64,
                        },
                    },
                    {
                        text: `Based on this screenshot and the current context, write a detailed and professional user guide description.
                        Current Title: "${currentTitle}"
                        Current Draft: "${currentDescription}"
                        
                        Task: Write a polished, easy-to-understand paragraph describing the action shown in the image. Explain what is happening and any important details the user should notice. Keep it under 3 sentences.`,
                    },
                ],
            },
        });

        return response.text || currentDescription;
    } catch (error) {
        console.error("Gemini Description Error:", error);
        return currentDescription;
    }
};
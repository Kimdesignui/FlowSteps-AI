import { GoogleGenAI, Type, Schema } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Analyze Screenshot for Title & Description ---
export const analyzeScreenshot = async (base64Image: string): Promise<{ title: string; description: string }> => {
  try {
    const ai = getClient();
    // Ensure base64 is clean
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

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
            text: "Bạn là chuyên gia viết tài liệu kỹ thuật. Hãy phân tích ảnh chụp màn hình UI này. \n1. Title: Tạo một tiêu đề ngắn gọn, bắt đầu bằng động từ (ví dụ: 'Nhấn nút Gửi', 'Truy cập Cài đặt') bằng tiếng Việt. \n2. Description: Viết hướng dẫn rõ ràng, súc tích giải thích chính xác người dùng cần làm gì ở bước này và tại sao. Viết bằng tiếng Việt, giọng văn hướng dẫn sử dụng.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Tiêu đề hành động (Tiếng Việt)" },
            description: { type: Type.STRING, description: "Hướng dẫn chi tiết (Tiếng Việt)" },
          },
          required: ["title", "description"],
        },
      },
    });

    const text = response.text;
    if (!text) return { title: "Đã chụp bước", description: "Vui lòng thêm mô tả thủ công." };

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      title: "Đã chụp bước",
      description: "Không thể tự động phân tích ảnh. Vui lòng nhập chi tiết thủ công.",
    };
  }
};

// --- Improve/Enhance Description ---
export const generateStepDescription = async (base64Image: string, currentTitle: string, currentDescription: string): Promise<string> => {
    try {
        const ai = getClient();
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

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
                        text: `Đóng vai một người viết tài liệu kỹ thuật chuyên nghiệp. Hãy cải thiện nội dung hướng dẫn sau dựa trên ngữ cảnh ảnh chụp màn hình.
                        
                        Tiêu đề hiện tại: "${currentTitle}"
                        Nháp hiện tại: "${currentDescription}"
                        
                        Nhiệm vụ: Viết lại bản nháp để chuyên nghiệp hơn, rõ ràng và súc tích hơn bằng Tiếng Việt. Đảm bảo nó phản ánh chính xác ảnh chụp màn hình. CHỈ trả về văn bản mô tả đã viết lại.`,
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

// --- Chat with AI Assistant ---
export const chatWithAI = async (message: string, history: {role: string, parts: {text: string}[]}[]): Promise<string> => {
    try {
        const ai = getClient();
        const chat = ai.chats.create({
            model: "gemini-3-flash-preview",
            config: {
                systemInstruction: "Bạn là Trợ lý AI hữu ích cho công cụ viết tài liệu 'FlowSteps AI'. Mục tiêu của bạn là giúp người dùng viết hướng dẫn sử dụng tốt hơn, gợi ý cải thiện sự rõ ràng, kiểm tra ngữ pháp tiếng Việt và cung cấp mẹo viết tài liệu kỹ thuật. Hãy trả lời ngắn gọn, hữu ích và LUÔN LUÔN dùng Tiếng Việt.",
            },
            history: history,
        });

        const result = await chat.sendMessage({ message });
        return result.text || "Xin lỗi, tôi không thể tạo phản hồi.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Xin lỗi, tôi gặp lỗi khi kết nối với AI.";
    }
}
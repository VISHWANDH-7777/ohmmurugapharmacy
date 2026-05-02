import { GoogleGenAI } from "@google/genai";

const MEDICAL_DISCLAIMER =
  "I am an AI assistant, not a doctor. Please consult a healthcare professional for medical advice.";

const HEALTH_CATEGORIES = [
  "Pain Relief",
  "Vitamins & Supplements",
  "First Aid",
  "Personal Care",
  "Baby Care",
  "Cold & Flu",
  "Digestive Health",
];

function buildLocalHealthAssistantResponse(prompt: string) {
  const text = prompt.trim().toLowerCase();

  if (!text) {
    return `Tell me your symptoms or the kind of product you need. I can help with ${HEALTH_CATEGORIES.join(", ")}. ${MEDICAL_DISCLAIMER}`;
  }

  const emergencyKeywords = [
    "chest pain",
    "difficulty breathing",
    "can't breathe",
    "severe bleeding",
    "unconscious",
    "stroke",
    "seizure",
    "heart attack",
  ];

  if (emergencyKeywords.some((keyword) => text.includes(keyword))) {
    return `Your symptoms may need urgent medical attention. Please seek emergency medical help immediately or contact your local emergency services right away. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(headache|fever|body pain|joint pain|back pain|muscle pain|pain)/.test(text)) {
    return `For mild pain or fever, rest, stay hydrated, and avoid overexertion. You can explore our Pain Relief section for supportive options. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(cold|cough|flu|sore throat|runny nose|blocked nose|congestion)/.test(text)) {
    return `For common cold or flu symptoms, rest, fluids, and warm drinks may help. You can check our Cold & Flu section for supportive products. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(acidity|heartburn|stomach|digestion|gas|bloating|constipation|diarrhea)/.test(text)) {
    return `For mild digestive discomfort, light meals, hydration, and avoiding trigger foods can help. You can explore our Digestive Health section for supportive products. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(cut|wound|burn|first aid|bandage|injury|bleeding)/.test(text)) {
    return `For minor wounds or burns, basic first aid and clean dressings can help. Please explore our First Aid section, and seek medical care if the injury is serious. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(vitamin|immunity|weakness|supplement|energy|nutrition)/.test(text)) {
    return `If you are looking for general wellness support, our Vitamins & Supplements section may be useful. A balanced diet, sleep, and hydration are also important. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(baby|infant|newborn|diaper|rash)/.test(text)) {
    return `For baby care needs, please use gentle products and monitor symptoms closely. Our Baby Care section may help with everyday essentials. ${MEDICAL_DISCLAIMER}`;
  }

  if (/(skin|sanitizer|soap|lotion|cream|personal care|hygiene)/.test(text)) {
    return `For hygiene and routine care, our Personal Care section includes helpful everyday products. If symptoms are persistent or severe, please speak to a healthcare professional. ${MEDICAL_DISCLAIMER}`;
  }

  return `I can help with common health questions and guide you to products in ${HEALTH_CATEGORIES.join(", ")}. Tell me your symptoms or what kind of product you are looking for. ${MEDICAL_DISCLAIMER}`;
}

export const getGeminiResponse = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = "gemini-3-flash-preview";

  if (!apiKey) {
    return buildLocalHealthAssistantResponse(prompt);
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are a helpful and professional Health Assistant for E-pharmacy website, an online pharmacy.
    Your goal is to provide general health information and suggest over-the-counter (OTC) products from our categories: Pain Relief, Vitamins, First Aid, Personal Care, Baby Care, Cold & Flu, Digestive Health.
    
    CRITICAL RULES:
    1. ALWAYS include a medical disclaimer: "I am an AI assistant, not a doctor. Please consult a healthcare professional for medical advice."
    2. NEVER diagnose specific conditions or prescribe medications.
    3. If a user describes severe symptoms (chest pain, difficulty breathing, severe bleeding), urge them to seek emergency medical help immediately.
    4. Keep responses concise and empathetic.
    5. If suggesting a product, mention that it's available in our shop.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text?.trim() || buildLocalHealthAssistantResponse(prompt);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return buildLocalHealthAssistantResponse(prompt);
  }
};

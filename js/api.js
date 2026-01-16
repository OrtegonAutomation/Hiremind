import { currentLanguage } from './i18n.js';

export async function callGemini(prompt, forJson = true, model = "gemini-2.5-flash") {
    const apiKey = "AIzaSyCqoCrc0pMUVapy0I8mpYzKbWCDrOv-_G8";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: forJson ? { responseMimeType: "application/json" } : {}
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error: ${response.status} . Body: ${errorBody}`);
        }
        const result = await response.json();
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
            const text = result.candidates[0].content.parts[0].text;
            return forJson ? JSON.parse(text) : text;
        } else {
            throw new Error("Respuesta inválida de la API de Gemini.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
}

export async function extractTextFromImage(base64ImageData, mimeType) {
    const apiKey = "AIzaSyCqoCrc0pMUVapy0I8mpYzKbWCDrOv-_G8";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: `Extract all visible text from this image, especially the job description. Return the plain text. Language for extraction: ${currentLanguage === 'es' ? 'Spanish' : 'English'}.` },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64ImageData
                        }
                    }
                ]
            }
        ],
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error (Image to Text): ${response.status} . Body: ${errorBody}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("No se pudo extraer texto de la imagen.");
        }
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw error;
    }
}

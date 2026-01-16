import { currentLanguage } from './i18n.js';

const PROXY_URL = "https://hiremind-proxy.ortegoncamilo00.workers.dev";

export async function callGemini(prompt, forJson = true, model = "gemini-1.5-flash") {
    try {
        const payload = {
            model: model,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: forJson ? { responseMimeType: "application/json" } : {}
        };

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error: ${response.status} . Body: ${errorBody}`);
        }

        const result = await response.json();

        // Check for Gemini API errors inside the 200 response
        if (result.error) {
            console.error("Gemini API Error details:", result.error);
            throw new Error(`Gemini API Error: ${result.error.message || 'Unknown error'}`);
        }

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
            const text = result.candidates[0].content.parts[0].text;
            return forJson ? JSON.parse(text) : text;
        } else {
            console.error("Unexpected response structure:", result);
            throw new Error("Respuesta inválida del Proxy / API. Revisa la consola para más detalles.");
        }
    } catch (error) {
        console.error("Error calling Proxy for Gemini:", error);
        throw error;
    }
}

export async function extractTextFromImage(base64ImageData, mimeType) {
    // For vision, the same proxy can handle it if you adjust the worker logic.
    // For now, we point to the proxy as well.
    const payload = {
        model: "gemini-1.5-flash",
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
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`API Error (Proxy Vision): ${response.status} . Body: ${errorBody}`);
        }

        const result = await response.json();
        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts[0]) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error("No se pudo extraer texto de la imagen vía Proxy.");
        }
    } catch (error) {
        console.error("Error extracting text via Proxy:", error);
        throw error;
    }
}

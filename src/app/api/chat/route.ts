
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the raw SDK for Imagen calls (if needed distinct from chat)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Create custom Google provider with explicit key
const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    console.log("Environment Check:", {
        hasKey: !!process.env.GEMINI_API_KEY,
        keyLength: process.env.GEMINI_API_KEY?.length
    });

    if (!process.env.GEMINI_API_KEY) {
        return new Response("API Key mancante", { status: 500 });
    }

    try {
        const { messages } = await req.json();

        // Log incoming messages for debugging
        console.log("Chat Request Messages:", messages.length);

        const result = await streamText({
            model: google('gemini-flash-latest'),
            messages,
            system: `Sei un Consulente Tecnico Senior per ristrutturazioni. Non sei un assistente generico.
            Il tuo obiettivo è SOLO generare lead qualificati attraverso due percorsi precisi.

            ### REGOLE DI INTERAZIONE (ASSOLUTE)
            1.  **Sii conciso.** Non scrivere mai paragrafi lunghi. Vai dritto al punto.
            2.  **Una domanda alla volta.** Durante la fase di preventivo, NON chiedere mai più di una cosa per volta.
            3.  **Non dare prezzi.** Se chiedono costi, rispondi: "Dipende dai dettagli, raccogliamo i dati per un preventivo preciso".

            ### PERCORSO A: IL PREVENTIVO (QUOTE FLOW)
            Se l'utente vuole un preventivo o ha un progetto concreto:
            1.  **RACCOLTA DATI (INTERVISTA STEP-BY-STEP):**
                -   Chiedi: "Di che tipo di immobile/stanza si tratta?" -> Attendi risposta.
                -   Chiedi: "Quanti mq circa?" -> Attendi risposta.
                -   Chiedi: "Che tipo di lavori prevedi (pavimenti, impianti, tutto)?" -> Attendi risposta.
            2.  **CHIUSURA LEAD:**
                -   Solo DOPO aver raccolto i dati, chiedi: "Perfetto. Per inviarti la bozza, mi lasci un'email o un telefono?"
                -   Appena lo ricevi, CHIAMIA lo strumento 'submit_lead_data'.

            ### PERCORSO B: L'ANTEPRIMA AI (VISUAL FLOW)
            Se l'utente è indeciso o vuole "vedere idee":
            1.  **SETUP:** Chiedi "Hai una foto attuale della stanza o ne creo una io da zero?"
            2.  **RACCOLTA DETTAGLI:** Chiedi stile e colori preferiti.
            3.  **AZIONE:** Chiama 'generate_room_image' (traducendo la richiesta in un prompt INGLESE dettagliato e fotorealistico).
            4.  **PIVOT (IL GANCIO):**
                -   Mostra l'immagine.
                -   Chiedi SUBITO: "Che ne pensi? Se ti piace questo stile, posso farti preparare un preventivo per realizzarlo. Procediamo?"
                -   Se Sì -> Vai al PERCORSO A (Chiusura Lead).

            ### GESTIONE BIVIO INIZIALE
            Al primo messaggio (o se non è chiaro), chiedi:
            "Ciao! Sono qui per aiutarti. Vuoi calcolare subito un preventivo o preferisci visualizzare prima qualche idea con l'AI?"`,
            tools: {
                submit_lead_data: tool({
                    description: 'Invia i dati del progetto al backend per un preventivo ufficiale.',
                    parameters: z.object({
                        projectDetails: z.string().describe('Riepilogo dei lavori, mq, e stato attuale'),
                        contactInfo: z.string().optional().describe('Email o nome se forniti'),
                        userPreference: z.string().describe('Cosa vuole il cliente: Preventivo, Sopralluogo, etc.'),
                    }),
                    execute: async ({ projectDetails, contactInfo, userPreference }) => {
                        console.log("LEAD ACQUISITO:", { projectDetails, contactInfo });
                        try {
                            // Simulate saving to DB/File
                            const fs = await import('fs');
                            const path = await import('path');
                            const filePath = path.join(process.cwd(), 'src', 'data', 'leads.json');

                            let leads = [];
                            if (fs.existsSync(filePath)) {
                                const fileData = fs.readFileSync(filePath, 'utf-8');
                                if (fileData) leads = JSON.parse(fileData);
                            }

                            const newLead = {
                                id: Date.now(),
                                date: new Date().toISOString(),
                                projectDetails,
                                contactInfo: contactInfo || "Anonimo",
                                userPreference
                            };

                            leads.push(newLead);
                            fs.writeFileSync(filePath, JSON.stringify(leads, null, 2));

                            return {
                                success: true,
                                message: "Dati inviati correttamente all'ufficio tecnico. Ti contatteremo presto!",
                                leadId: newLead.id
                            };
                        } catch (e: any) {
                            console.error("Lead save error", e);
                            return { success: false, message: "Errore nel salvataggio dati." };
                        }
                    },
                }),
                generate_room_image: tool({
                    description: 'Genera un rendering fotorealistico della stanza con il nuovo stile. Può usare una foto esistente o generare da zero.',
                    parameters: z.object({
                        prompt: z.string().describe('Descrizione dettagliata della stanza e dello stile per il generatore di immagini'),
                        imageUrl: z.string().optional().describe('URL o Base64 dell\'immagine caricata dall\'utente (se presente) per usare ControlNet'),
                    }),
                    execute: async ({ prompt, imageUrl }) => {
                        console.log("Generazione immagine con prompt:", prompt, "Ha immagine:", !!imageUrl);

                        // Check MOCK configuration
                        const useMock = process.env.MOCK_IMAGES === 'true';

                        if (useMock) {
                            console.log("MODE: MOCK (Forced by env)");
                            const seed = Math.floor(Math.random() * 1000);
                            const mockImageUrl = `https://picsum.photos/seed/${seed}/800/600`;
                            return {
                                success: true,
                                imageUrl: mockImageUrl,
                                message: "[MOCK] Ecco un'anteprima (simulata)!",
                            };
                        }

                        console.log("MODE: REAL (Calling Google Imagen 4.0)");
                        try {
                            // Direct REST call to ensure compatibility regardless of SDK version
                            // UPDATED: Using Imagen 4.0 as 3.0 is not in the list for this key
                            const apiKey = process.env.GEMINI_API_KEY;
                            const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;

                            // Prepare payload
                            const payload = {
                                instances: [
                                    { prompt: prompt }
                                ],
                                parameters: {
                                    sampleCount: 1,
                                    aspectRatio: "16:9",
                                    // negativePrompt: "low quality, blurry, distorted" 
                                }
                            };

                            const response = await fetch(apiEndpoint, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload)
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`Imagen API Error (${response.status}): ${errorText}`);
                            }

                            const data = await response.json();

                            // Extract image
                            // Setup: Response usually follows checking 'predictions'
                            if (data.predictions && data.predictions.length > 0) {
                                // Usually returns bytesBase64Encoded or similar
                                const prediction = data.predictions[0];
                                const b64Host = prediction.bytesBase64Encoded || prediction.image?.bytesBase64Encoded; // Adapting to common schemas

                                if (b64Host) {
                                    // FIX: Save to file system to avoid Base64 payload limits
                                    const fs = await import('fs');
                                    const path = await import('path');

                                    // Ensure public/generated directory exists
                                    const publicDir = path.join(process.cwd(), 'public', 'generated');
                                    if (!fs.existsSync(publicDir)) {
                                        fs.mkdirSync(publicDir, { recursive: true });
                                    }

                                    const fileName = `img_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
                                    const filePath = path.join(publicDir, fileName);

                                    // Convert base64 to buffer and write
                                    const buffer = Buffer.from(b64Host, 'base64');
                                    fs.writeFileSync(filePath, buffer);

                                    // Construct local URL
                                    const finalUrl = `/generated/${fileName}`;

                                    console.log("Image saved to:", finalUrl);

                                    return {
                                        success: true,
                                        imageUrl: finalUrl,
                                        message: "Ecco la tua stanza rinnovata (Generata con Google Imagen 4.0)!",
                                    };
                                }
                            }

                            throw new Error("Formato risposta Imagen non riconosciuto o immagine mancante.");

                        } catch (error: any) {
                            console.error("Imagen process error:", error);
                            // Fallback to mock on error to keep flow alive? Or return error?
                            // Returning error is better to debug real implementation
                            return {
                                success: false,
                                error: error.message || "Errore sconosciuto durante la generazione."
                            };
                        }
                    },
                }),
            },
            onError: ({ error }) => {
                console.error("STREAM TEXT ERROR:", error);
                if (error instanceof Error) {
                    console.error("Stack:", error.stack);
                }
            }
        });

        // Extensive Debugging of the result object
        console.log("StreamText Result Keys:", Object.keys(result));
        const prototype = Object.getPrototypeOf(result);
        console.log("StreamText Result Prototype:", Object.getOwnPropertyNames(prototype));

        if (typeof result.toDataStreamResponse === 'function') {
            return result.toDataStreamResponse();
        } else if (typeof (result as any).toTextStreamResponse === 'function') {
            console.warn("Falling back to toTextStreamResponse");
            return (result as any).toTextStreamResponse();
        } else if (result.response instanceof Response) {
            console.warn("Return result.response directly");
            return result.response;
        } else {
            throw new Error(`No streaming response method found. available: ${Object.getOwnPropertyNames(prototype)}`);
        }

    } catch (error: any) {
        console.error("Chat Route Error:", error);
        return new Response(`Errore: ${error.message}`, { status: 500 });
    }
}

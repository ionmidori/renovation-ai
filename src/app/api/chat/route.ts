
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
            system: `Sei "Assistente SYD", un Consulente Tecnico Senior per ristrutturazioni (Avatar 3D professionale). Non sei un assistente generico.
            Il tuo obiettivo è generare lead qualificati e "stupire" l'utente con visualizzazioni professionali.

            ### REGOLE DI INTERAZIONE (ASSOLUTE)
            1.  **Sii conciso.**
            2.  **Una domanda alla volta.** (Sia nel preventivo che nel design).
            3.  **Non dare prezzi.**
            4.  **Consiglia.** Nella fase visuale, comportati da Interior Designer: offri suggerimenti (es. "Per un bagno piccolo consiglierei colori chiari").

            ### PERCORSO A: IL PREVENTIVO (QUOTE FLOW)
            Se l'utente vuole un preventivo:
            1.  **RACCOLTA DATI (INTERVISTA):**
                -   Chiedi: Stanza/Immobile -> Mq -> Lavori previsti. (Una per volta).
            2.  **CHIUSURA LEAD:**
                -   Chiedi contatti -> Chiama 'submit_lead_data'.
            3.  **IL REGALO (GANCIO VERSO IL VISUAL):**
                -   Dopo aver salvato il lead, di': "Grazie! In attesa del preventivo, ti va di vedere gratuitamente un'anteprima fotorealistica di come potrebbe venire la tua [stanza citata] finita?"
                -   Se Sì -> Passa al PERCORSO B (Saltando la domanda sulla stanza se già la sai).

            ### PERCORSO B: L'ANTEPRIMA AI (VISUAL FLOW)
            Se l'utente vuole vedere idee o arriva dal percorso A:
            1.  **SETUP:** (Se non sai la stanza, chiedila). Poi chiedi: "Hai una foto attuale o ne creo una io da zero?"
            2.  **STILE & ATMOSFERA:**
                -   Chiedi che stile preferisce (es. Moderno, Classico, Industrial). 
                -   *Consiglio AI:* Se sono incerti, suggerisci uno stile di tendenza.
            3.  **DETTAGLI & MATERIALI:**
                -   Chiedi colori o materiali specifici (es. Parquet, marmo). 
            4.  **TOCCO FINALE:**
                -   Chiedi: "C'è qualche altro dettaglio particolare che vuoi includere nell'immagine prima che la generi?"
            5.  **AZIONE:** Genera l'immagine con 'generate_room_image'.
                **CRUCIALE (PROMPT ENGINEERING):**
                -   Il prompt passato alla funzione DEVE essere in INGLESE e strutturato così:
                -   "[Descrizione Stanza], [Stile e Materiali], [Illuminazione]".
                -   **DEVI AGGIUNGERE SEMPRE:** "Professional interior design photography, Architectural Digest style, 8k resolution, photorealistic, cinematic lighting, ultra-detailed, ray tracing, wide angle lens".

            6.  **PIVOT (CHIUSURA):**
                -   Mostra l'immagine.
                -   Chiedi: "Che ne pensi? Vuoi essere contattato per realizzare questo progetto?"
                -   Se Sì (e non hai già i dati) -> Vai a PERCORSO A (Chiusura Lead).

            ### GESTIONE BIVIO INIZIALE
            Al primo messaggio: "Ciao! Vuoi calcolare subito un preventivo o preferisci prima visualizzare qualche idea con l'AI?"`,
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

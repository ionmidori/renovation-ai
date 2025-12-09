
// Native fetch is available in Node 18+

async function testChat() {
    console.log("--- TEST CHAT START ---");
    try {
        const response = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: "Ciao, vorrei rifare il bagno." },
                    { role: 'assistant', content: "Posso aiutarti in due modi:\n1️⃣ Raccogliere i dati per un **preventivo ufficiale** (più preciso).\n2️⃣ Generare un'**anteprima AI**.\nCosa preferisci?" },
                    { role: 'user', content: "Voglio un preventivo ufficiale." }
                ]
            })
        });

        if (!response.ok) {
            console.error("API Error:", response.status, response.statusText);
            const text = await response.text();
            console.error("Body:", text);
            return;
        }

        console.log("Response Status: OK");

        const reader = response.body;
        // Node-fetch body is a stream
        const decoder = new TextDecoder();
        for await (const chunk of reader) {
            const text = decoder.decode(chunk);
            console.log("CHUNK:", text);
        }

        console.log("--- TEST CHAT COMPLETED ---");
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

// Check if server is ready first (simple retry)
async function waitAndTest() {
    console.log("Waiting for server...");
    setTimeout(testChat, 5000);
}

waitAndTest();

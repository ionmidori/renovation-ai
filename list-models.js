
const { GoogleGenerativeAI } = require("@google/generative-ai");

const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
if (!match) throw new Error("API Key not found in .env.local");
const apiKey = match[1].trim();
process.env.GEMINI_API_KEY = apiKey; // Set for consistency

// Initialize (though we use fetch for listing)
// const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // Actually, directly listing models might need a different call or just try/catch
        // The SDK documentation says accessing models is usually done via specific calls, 
        // but we can try to "get" a model and see if it works, or use the REST API via fetch if SDK doesn't expose list easily in this version.

        // Better: use simple fetch to the headers
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        console.log("Fetching models from:", url);
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.error("No models found or error:", data);
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();

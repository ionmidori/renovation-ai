# 🏠 Renovation AI - Assistente SYD

Assistente AI per ristrutturazioni e interior design, powered by Google Gemini.

![Next.js](https://img.shields.io/badge/Next.js-16.0.8-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green)

---

## ✨ Funzionalità

- 🤖 **Chat AI Conversazionale** - Assistente virtuale "SYD" powered by Gemini 2.0 Flash
- 🎨 **Generazione Immagini 3D** - Visualizzazioni fotorealistiche ristrutturazioni (Imagen 3)
- 🎤 **Input Vocale** - Speech-to-Text integrato
- 📸 **Upload Immagini** - Analisi foto esistente + modifiche AI
- 💼 **Lead Generation** - Workflow guidato per raccolta preventivi
- 🎭 **Avatar Personalizzato** - SYD avatar con design neon

---

## 🚀 Quick Start

### Requisiti
- Node.js 20.x o superiore
- Google Gemini API Key ([Get it here](https://aistudio.google.com/apikey))

### Installazione

```bash
# Clone repository
git clone <repository-url>
cd renovation-next

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# Start development server
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

---

## 🔑 Configurazione

### Environment Variables

Crea un file `.env.local` nella root del progetto:

```bash
GEMINI_API_KEY=your_api_key_here
```

⚠️ **IMPORTANTE**: Senza questa chiave API, l'applicazione non funzionerà!

---

## 📁 Struttura Progetto

```
renovation-next/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   │   ├── chat/     # Chat AI endpoint
│   │   │   └── list-models/
│   │   ├── page.tsx      # Homepage
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── chat/         # Chat UI components
│   │   ├── ArchitectAvatar.tsx
│   │   └── VoiceRecorder.tsx
│   ├── hooks/            # Custom React hooks
│   ├── context/          # React Context
│   └── lib/              # Utilities & types
└── public/               # Static assets
```

---

## 🛠️ Comandi Disponibili

```bash
npm run dev      # Development server (http://localhost:3000)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## 🌐 Deployment

### Vercel (Raccomandato)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. Push codice su GitHub/GitLab
2. Importa su Vercel
3. Aggiungi `GEMINI_API_KEY` nelle Environment Variables
4. Deploy!

### Altre Piattaforme

Consulta [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) per:
- Netlify
- Docker
- Self-hosted (VPS)
- Configurazione avanzata

---

## 📚 Tecnologie Utilizzate

### Core
- **Next.js 16** - React framework con App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling

### AI & APIs
- **Google Gemini AI** - LLM & Image Generation
- **Vercel AI SDK** - AI integrations
- **@google/generative-ai** - Gemini SDK

### UI/UX
- **Framer Motion** - Animazioni
- **Lucide React** - Icone
- **React Three Fiber** - 3D rendering (opzionale)

---

## 🎯 Roadmap

- [x] Chat AI conversazionale
- [x] Generazione immagini 3D
- [x] Voice input
- [x] Lead collection workflow
- [ ] User authentication
- [ ] Payment integration (Stripe)
- [ ] Admin dashboard
- [ ] Email notifications
- [ ] Database persistence

---

## 🐛 Bug Reports & Features

Apri una [Issue](https://github.com/your-repo/issues) per:
- Segnalare bug
- Richiedere nuove funzionalità
- Domande tecniche

---

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE) per dettagli

---

## 🤝 Contributi

I contributi sono benvenuti! Consulta [CONTRIBUTING.md](CONTRIBUTING.md) per le guidelines.

---

## 📞 Supporto

- 📖 [Documentazione Completa](./DEPLOYMENT_GUIDE.md)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 📧 Email: support@renovation-ai.com

---

**Made with ❤️ using Next.js & Google Gemini AI**

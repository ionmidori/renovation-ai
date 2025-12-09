import ChatBot from '@/components/chat/ChatBot';

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-slate-50 overflow-hidden flex items-center justify-center">
      <div className="text-center space-y-4 p-10 opacity-50">
        <h1 className="text-4xl font-light text-slate-300">Renovation AI</h1>
        <p className="text-slate-400">Chiedi all&apos;assistente per iniziare</p>
      </div>

      {/* Floating ChatBot */}
      <ChatBot />
    </main>
  );
}

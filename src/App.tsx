import { Chatbot } from "@/components/Chatbot";
import { Map } from "@/components/Map";
import { Dashboard } from "@/components/Dashboard";
import systemPrompt from "@/system";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex flex-col items-center p-4 gap-6">

      {/* Dashboard */}
      <Dashboard />

      {/* Chatbot + Heatmap */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 w-full max-w-[1400px]">
        <Chatbot
          title="5ALES"
          system={systemPrompt}
          placeholder="¿Cual producto se vendio más?"
        />
        <Map />
      </div>
      {/* Footer */}
      <p className="text-xs text-muted-foreground/60 animate-fade-in">
        Built with React • Vite • shadcn/ui • Vercel AI SDK • deck.gl
      </p>
    </div>
  );
}

export default App;

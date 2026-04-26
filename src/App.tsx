import { Chatbot } from "@/components/Chatbot";
import { Map } from "@/components/Map";
import systemPrompt from "@/system";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex flex-col items-center p-4 gap-6">
      {/* Heading */}
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          Asistente Mercado El Roble
        </h1>
        <p className="text-muted-foreground text-sm max-w-md">
          Analiza ventas, productos y clientes de la tienda con{" "}
          <span className="font-medium text-foreground">inteligencia artificial</span>{" "}
          impulsada por Claude.
        </p>
      </div>

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

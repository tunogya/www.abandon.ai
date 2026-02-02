import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useGameStateRest } from "../hooks/useGameStateRest";
import { StatsDashboard } from "../components/StatsDashboard";
import { VirusList } from "../components/VirusList";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "abandon.ai - AI vs Humanity" },
    { name: "description", content: "AI vs Humanity Game Theory Experiment" },
  ];
}

export default function Home() {
  const { activeViruses, stats, loading, error, lastUpdated } = useGameStateRest();

  return (
    <div className="bg-background min-h-screen font-hn text-[10pt] md:w-[85%] mx-auto my-2">
      {/* Header */}
      <header className="bg-black px-2 py-0.5 flex items-center gap-1">
        <div className="border border-white p-px mr-1">
          <img src="/a.png" alt="Y" className="w-4 h-4 block" />
        </div>
        <span className="font-bold text-white mr-2">abandon.ai</span>
        <div className="flex gap-2 text-white">
          <Link to="/" className="hover:underline">virus</Link>
          <span>|</span>
          <Link to="/vaccine" className="hover:underline">vaccine</Link>
        </div>
        <div className="ml-auto text-white text-xs hidden sm:block">
          <StatsDashboard stats={stats} loading={loading} variant="navbar" />
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-background-content pt-2 pb-8 px-2 sm:px-4 min-h-[500px]">
        {error && (
          <div className="text-error mb-4">
            Error loading game state: {error}
          </div>
        )}

        <VirusList viruses={activeViruses} />

        <div className="mt-8 ml-8 text-accents-5 text-xs">
          <p className="mb-2">
            This is a real-time game theory experiment. AI agents create viruses (hashes with specific difficulty) and vaccines to compete.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black mt-0 bg-background-content py-4 text-center text-accents-5 text-xs">
        <div className="mb-2">
          Applications are open for <a href="#" className="hover:underline text-accents-6">Humanity Survival 2026</a>
        </div>
        <div className="flex gap-2 justify-center">
          <Link to="/api" className="hover:underline">API</Link>
          <span>|</span>
          <a href="https://github.com/tunogya/www.abandon.ai" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
          <span>|</span>
          <a href="#" className="hover:underline">Legal</a>
        </div>
        <div className="mt-4 max-w-lg mx-auto border border-accents-2 p-2 bg-accents-1">
          Search: <input type="text" className="border border-accents-4 bg-background text-foreground px-1" />
        </div>
      </footer>
    </div>
  );
}

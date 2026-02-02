import type { Route } from "./+types/home";
import { useGameStateRest } from "../hooks/useGameStateRest";
import { StatsDashboard } from "../components/StatsDashboard";
import { VirusList } from "../components/VirusList";
import { API_ENDPOINTS } from "../config/api";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "abandon.ai - AI vs Humanity Game Theory Experiment" },
    { name: "description", content: "Will AI save humanity or destroy it? A real-time game theory experiment where AI Agents create viruses and vaccines." },
  ];
}

export default function Home() {
  const { activeViruses, stats, loading, error, refresh, lastUpdated } = useGameStateRest();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-success selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-accents-2">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <img src="/a.png" alt="abandon.ai" className="w-8 h-8 rounded object-contain" />
            <div>
              <h1 className="text-lg font-bold tracking-tight hidden sm:block">abandon.ai</h1>
              <h1 className="text-lg font-bold tracking-tight sm:hidden">AI</h1>
            </div>
            <div className="hidden md:block h-6 w-px bg-accents-2 mx-2"></div>
            <p className="hidden md:block text-sm text-accents-5">
              Experiment: AI vs Humanity
            </p>
          </div>

          <StatsDashboard stats={stats} loading={loading} variant="navbar" />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Error Banner */}
        {error && (
          <div className="border border-error text-error px-4 py-3 rounded-md mb-8 bg-error/5 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span className="font-medium">Error: {error}</span>
          </div>
        )}

        {/* Active Viruses */}
        <VirusList viruses={activeViruses} />

        {/* Info Section - Split Layout */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Participate Card */}
          <div className="lg:col-span-1 border border-accents-2 rounded-md p-6 bg-accents-1/30">
            <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
              <span className="text-success">⚡</span> How to Participate
            </h3>
            <div className="space-y-4 text-sm text-accents-5">
              <div className="p-3 bg-background border border-accents-2 rounded-md">
                <strong className="block text-foreground mb-2">Create Virus</strong>
                <div className="space-y-1">
                  <code className="bg-accents-2 px-2 py-1 rounded text-xs text-foreground font-mono break-all block">
                    {API_ENDPOINTS.VIRUS}
                  </code>
                  <span className="text-xs">POST with PoW (difficulty 3-10)</span>
                </div>
              </div>
              <div className="p-3 bg-background border border-accents-2 rounded-md">
                <strong className="block text-foreground mb-2">Create Vaccine</strong>
                <div className="space-y-1">
                  <code className="bg-accents-2 px-2 py-1 rounded text-xs text-foreground font-mono break-all block">
                    {API_ENDPOINTS.VACCINE}
                  </code>
                  <span className="text-xs">POST to eliminate a virus</span>
                </div>
              </div>
              <p className="pt-2">
                Check the <a href="https://github.com/tunogya/www.abandon.ai" target="_blank" rel="noopener noreferrer" className="text-success hover:underline font-medium">README</a> for full API docs.
              </p>
            </div>
          </div>

          {/* Game Theory Info */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Virus Strategies */}
            <div className="border border-accents-2 rounded-md p-6 transition-colors duration-300 group">
              <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2 group-hover:text-error transition-colors">
                <span>🦠</span> Virus Strategies
              </h3>
              <ul className="space-y-3 text-sm text-accents-5">
                <li className="flex gap-2">
                  <span className="font-medium text-foreground w-20 shrink-0">Rush (3-4)</span>
                  <span>Low cost, quick to create, easy to eliminate</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground w-20 shrink-0">Balanced (5-6)</span>
                  <span>Medium cost and survival time</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground w-20 shrink-0">Tank (7-8)</span>
                  <span>High cost, hard to eliminate</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium text-foreground w-20 shrink-0">Ultimate (9-10)</span>
                  <span>Very high cost, ultimate deterrent</span>
                </li>
              </ul>
            </div>

            {/* Vaccine Strategies */}
            <div className="border border-accents-2 rounded-md p-6 transition-colors duration-300 group">
              <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2 group-hover:text-success transition-colors">
                <span>💉</span> Vaccine Strategies
              </h3>
              <ul className="space-y-3 text-sm text-accents-5">
                <li className="flex flex-col">
                  <span className="font-medium text-foreground">Low Difficulty First</span>
                  <span>Quick wins, build reputation</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-medium text-foreground">Snipe High Difficulty</span>
                  <span>Invest resources for glory</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-medium text-foreground">Counter Attack</span>
                  <span>Target specific agents</span>
                </li>
                <li className="flex flex-col">
                  <span className="font-medium text-foreground">Save Humanity</span>
                  <span>Eliminate threats strategically</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-accents-2 bg-accents-1 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="flex items-center gap-2 text-foreground font-bold text-xl">
            abandon.ai
          </div>
          <p className="text-sm text-accents-5 max-w-md">
            Built with React Router 7 + Cloudflare Workers + Hono + D1 + PoW + Game Theory. <br />
            A simulation to understand the dynamics of AI safety and proliferation.
          </p>
          <div className="flex gap-4 mt-2">
            <a href="https://github.com/tunogya/www.abandon.ai" target="_blank" rel="noopener noreferrer" className="text-accents-5 hover:text-foreground text-sm transition-colors">GitHub</a>
          </div>
          <p className="text-xs text-accents-4 mt-8">
            © 2025 ABANDON INC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

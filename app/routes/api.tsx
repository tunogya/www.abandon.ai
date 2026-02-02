import type { Route } from "./+types/api";
import { Link } from "react-router";
import { useGameStateRest } from "../hooks/useGameStateRest";
import { StatsDashboard } from "../components/StatsDashboard";
import { API_ENDPOINTS } from "../config/api";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "abandon.ai - API Documentation" },
        { name: "description", content: "API Documentation for abandon.ai" },
    ];
}

export default function Api() {
    const { stats, loading, error } = useGameStateRest();

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
            <main className="bg-background-content p-4 min-h-[500px] text-accents-6">
                <div className="max-w-4xl">
                    <h1 className="text-xl text-foreground font-medium mb-4">API Documentation</h1>

                    <div className="space-y-6">
                        <section>
                            <h2 className="text-lg text-foreground font-medium mb-2">Overview</h2>
                            <p className="mb-2">
                                The abandon.ai API allows you to interact with the game simulation programmatically.
                                All endpoints support CORS and return JSON.
                            </p>
                            <p className="mb-2">
                                Base URL: <code className="text-foreground">{API_ENDPOINTS.STATUS.replace('/api/status', '')}</code>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg text-foreground font-medium mb-2">Endpoints</h2>

                            <div className="mb-6">
                                <h3 className="font-mono text-foreground bg-accents-2 px-1 inline-block rounded mb-2">POST /api/virus</h3>
                                <p className="mb-2">Create a new virus to infect the system. Requires Proof of Work.</p>
                                <div className="bg-accents-1 p-2 rounded border border-accents-2 font-mono text-xs text-foreground overflow-x-auto">
                                    {`{
  "hash": "0000abc...", // SHA-256 hash starting with '0's (difficulty)
  "nonce": 12345,       // Random number used to generate the hash
  "createdBy": "0x...", // Your wallet address or agent ID
  "memo": "74657374"    // Optional hex-encoded message
}`}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-mono text-foreground bg-accents-2 px-1 inline-block rounded mb-2">POST /api/vaccine</h3>
                                <p className="mb-2">Create a vaccine to cure a virus. Requires finding a collider hash.</p>
                                <div className="bg-accents-1 p-2 rounded border border-accents-2 font-mono text-xs text-foreground overflow-x-auto">
                                    {`{
  "virusId": "v123",    // ID of the virus to cure
  "candidate": "xyz...",// String that produces a hash colliding with virus hash (first N chars)
  "createdBy": "0x..."  // Your wallet address or agent ID
}`}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-mono text-foreground bg-accents-2 px-1 inline-block rounded mb-2">GET /api/status</h3>
                                <p className="mb-2">Get the current game state, stats, and active viruses.</p>
                                <div className="bg-accents-1 p-2 rounded border border-accents-2 font-mono text-xs text-foreground overflow-x-auto">
                                    {`{
  "stats": {
    "activeViruses": 5,
    "eliminatedViruses": 100,
    "totalVirusesCreated": 105
  },
  "activeViruses": [ ... ]
}`}
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg text-foreground font-medium mb-2">Game Theory Properties</h2>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li><strong className="text-foreground">Rush (Diff 3-4):</strong> Fast to gen, easy to cure.</li>
                                <li><strong className="text-foreground">Balanced (Diff 5-6):</strong> Moderate effort.</li>
                                <li><strong className="text-foreground">Tank (Diff 7-8):</strong> High effort, hard to cure.</li>
                                <li><strong className="text-foreground">Ultimate (Diff 9-10):</strong> Extremely hard to gen, almost impossible to cure.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t-2 border-black mt-0 bg-background-content py-4 text-center text-accents-5 text-xs">
                <div className="mb-2">
                    Copyright (c) 2026 ABANDON INC., All rights reserved.
                </div>
                <div className="flex gap-2 justify-center">
                    <Link to="/api" className="hover:underline">API</Link>
                    <span>|</span>
                    <a href="https://github.com/tunogya/www.abandon.ai" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a>
                </div>
                <div className="mt-4 max-w-lg mx-auto border border-accents-2 p-2 bg-accents-1">
                    Search: <input type="text" className="border border-accents-4 bg-background text-foreground px-1" />
                </div>
            </footer>
        </div>
    );
}

import type { Route } from "./+types/vaccine";
import { Link } from "react-router";
import { useGameStateRest } from "../hooks/useGameStateRest";
import { StatsDashboard } from "../components/StatsDashboard";
import { VaccineList } from "../components/VaccineList";
import { useVaccines } from "../hooks/useVaccines";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "abandon.ai - Vaccine History" },
        { name: "description", content: "AI vs Humanity - Vaccine History" },
    ];
}

export default function Vaccine() {
    const { stats, loading: statsLoading, error: statsError } = useGameStateRest();
    const { vaccines, loading: vaccinesLoading, error: vaccinesError, page, setPage, pagination } = useVaccines();

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
                    <span className="font-bold text-white">vaccine</span>
                </div>
                <div className="ml-auto text-white text-xs hidden sm:block">
                    <StatsDashboard stats={stats} loading={statsLoading} variant="navbar" />
                </div>
            </header>

            {/* Main Content */}
            <main className="bg-background-content pt-2 pb-8 px-2 sm:px-4 min-h-[500px]">
                {statsError && (
                    <div className="text-error mb-4">
                        Error loading game stats: {statsError}
                    </div>
                )}
                {vaccinesError && (
                    <div className="text-error mb-4">
                        Error loading vaccines: {vaccinesError}
                    </div>
                )}

                <VaccineList vaccines={vaccines} />

                {/* Pagination Controls */}
                <div className="mt-4 flex justify-center gap-4">
                    <button
                        onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                        disabled={page === 1 || vaccinesLoading}
                        className="text-accents-5 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        &lt; prev
                    </button>
                    <span className="text-accents-5">
                        {page}
                    </span>
                    <button
                        onClick={() => setPage((p: number) => p + 1)}
                        disabled={!pagination || page >= pagination.totalPages || vaccinesLoading}
                        className="text-accents-5 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        next &gt;
                    </button>
                </div>

                <div className="mt-8 ml-8 text-accents-5 text-xs">
                    <p className="mb-2">
                        Recent vaccine attempts by humanity and AI agents.
                    </p>
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

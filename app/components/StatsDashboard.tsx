import type { GameStats } from '../types';

interface StatsDashboardProps {
  stats: GameStats;
  connected: boolean;
}

export function StatsDashboard({ stats, connected }: StatsDashboardProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Game Statistics</h2>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-accents-2 bg-accents-1">
          <div
            className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-error'
              }`}
          />
          <span className="text-xs font-medium text-accents-5">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Viruses"
          value={stats.activeViruses}
          icon="🦠"
        />
        <StatCard
          label="Total Viruses"
          value={stats.totalVirusesCreated}
          icon="📊"
        />
        <StatCard
          label="Eliminated"
          value={stats.eliminatedViruses}
          icon="💉"
        />
        <StatCard
          label="Unique Addresses"
          value={stats.uniqueAddresses}
          icon="🤖"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
        <StatCard
          label="Total Vaccines"
          value={stats.totalVaccinesCreated}
          icon="💊"
        />
        <StatCard
          label="Successful"
          value={stats.successfulVaccines}
          icon="✅"
        />
        <StatCard
          label="Failed"
          value={stats.failedVaccines}
          icon="❌"
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="group border border-accents-2 rounded-md p-4 bg-background transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl opacity-70 group-hover:opacity-100 transition-opacity">{icon}</span>
      </div>
      <div>
        <span className="text-2xl font-bold text-foreground block tracking-tight">{value}</span>
        <span className="text-xs text-accents-5 uppercase font-medium tracking-wider">{label}</span>
      </div>
    </div>
  );
}

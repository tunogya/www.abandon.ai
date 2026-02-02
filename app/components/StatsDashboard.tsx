import type { GameStats } from '../types';

interface StatsDashboardProps {
  stats: GameStats;
  loading: boolean;
  variant?: 'default' | 'navbar';
}

export function StatsDashboard({ stats, loading, variant = 'default' }: StatsDashboardProps) {
  if (variant === 'navbar') {
    return (
      <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${!loading ? 'bg-success' : 'bg-warning'
              }`}
          />
          <span className="text-[10px] font-medium text-accents-5 uppercase tracking-wider hidden sm:block">
            {loading ? 'SYNCING' : 'LIVE'}
          </span>
        </div>

        <div className="h-3 w-px bg-accents-2 shrink-0 hidden sm:block"></div>

        <div className="flex items-center gap-4 sm:gap-6">
          <CompactStat label="ACTIVE" value={stats.activeViruses} color="text-error" />
          <CompactStat label="TOTAL" value={stats.totalVirusesCreated} />
          <CompactStat label="CURED" value={stats.eliminatedViruses} color="text-success" />
          <CompactStat label="AGENTS" value={stats.uniqueAddresses} />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Game Statistics</h2>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-accents-2 bg-accents-1">
          <div
            className={`w-2 h-2 rounded-full ${!loading ? 'bg-success' : 'bg-warning'
              }`}
          />
          <span className="text-xs font-medium text-accents-5">
            {loading ? 'Loading...' : 'Live'}
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
    </div>
  );
}

interface CompactStatProps {
  label: string;
  value: number;
  color?: string;
}

function CompactStat({ label, value, color = "text-foreground" }: CompactStatProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 shrink-0">
      <span className="text-[10px] text-accents-5 uppercase font-medium tracking-widest">{label}</span>
      <span className={`text-xs font-mono font-bold tracking-tight ${color}`}>{value}</span>
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

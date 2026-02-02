import type { GameStats } from '../types';

interface StatsDashboardProps {
  stats: GameStats;
  loading: boolean;
  variant?: 'default' | 'navbar';
}

export function StatsDashboard({ stats, loading, variant = 'default' }: StatsDashboardProps) {
  // In HN style, we don't really have "cards". It's just a line of text.
  // We'll render a simple text span that can be placed in the header or below it.

  const textColor = variant === 'navbar' ? 'text-white' : 'text-foreground';

  return (
    <div className={`text-[10pt] ${textColor} flex items-center gap-2`}>
      {loading && <span className="text-accents-5 mr-1">(syncing...)</span>}
      <span>active: {stats.activeViruses}</span>
      <span>|</span>
      <span>total: {stats.totalVirusesCreated}</span>
      <span>|</span>
      <span>cured: {stats.eliminatedViruses}</span>
      <span>|</span>
      <span>agents: {stats.uniqueAddresses}</span>
    </div>
  );
}

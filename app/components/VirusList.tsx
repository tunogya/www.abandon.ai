import type { Virus } from '../types';

interface VirusListProps {
  viruses: Virus[];
}

export function VirusList({ viruses }: VirusListProps) {
  if (viruses.length === 0) {
    return (
      <div className="border border-accents-2 rounded-md p-12 text-center bg-background">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accents-1 mb-6 text-3xl">
          🌍
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">
          No Active Viruses
        </h3>
        <p className="text-accents-4">Humanity is safe... for now.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-6">
        Active Viruses <span className="text-accents-4 ml-2 text-lg font-normal">({viruses.length})</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {viruses.map((virus) => (
          <VirusCard key={virus.id} virus={virus} />
        ))}
      </div>
    </div>
  );
}

function VirusCard({ virus }: { virus: Virus }) {
  const difficultyLabel = getDifficultyLabel(virus.difficulty);
  const memoText = virus.memo ? hexToText(virus.memo) : null;

  return (
    <div className="group flex flex-col justify-between border border-accents-2 rounded-md p-5 bg-background transition-all duration-200">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-accents-1 border border-accents-2 group-hover:bg-foreground group-hover:text-background transition-colors">
              <span className="text-sm">🦠</span>
            </div>
            <span className="font-semibold text-foreground">Virus</span>
          </div>
          <Badge difficulty={virus.difficulty}>{difficultyLabel}</Badge>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-accents-5 font-semibold">Hash</div>
            <div className="font-mono text-xs text-foreground truncate select-all" title={virus.hash}>
              {virus.hash}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-accents-5 font-semibold">Created By</div>
            <div className="font-mono text-xs text-foreground truncate" title={virus.createdBy}>
              {virus.createdBy.slice(0, 6)}...{virus.createdBy.slice(-4)}
            </div>
          </div>

          {memoText && (
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-accents-5 font-semibold">Memo</div>
              <div className="text-xs text-accents-6 italic break-words">{memoText}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-accents-2 flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-accents-5 font-semibold">Created</div>
          <div className="text-xs text-foreground">
            {new Date(virus.createdAt).toLocaleTimeString()}
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-accents-5 font-semibold">Nonce</div>
          <div className="font-mono text-xs text-foreground">{virus.nonce}</div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, difficulty }: { children: React.ReactNode, difficulty: number }) {
  // Vercel style badges are usually monochromatic or very subtle
  let colorClass = "bg-accents-1 text-accents-6 border-accents-2";

  if (difficulty >= 9) colorClass = "bg-accents-8 text-background border-transparent"; // Black (ultimate)
  else if (difficulty >= 7) colorClass = "bg-error text-white border-transparent";
  else if (difficulty >= 5) colorClass = "bg-warning text-white border-transparent";

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colorClass} tracking-wider`}>
      {children} ({difficulty})
    </span>
  );
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 4) return 'RUSH';
  if (difficulty <= 6) return 'BALANCED';
  if (difficulty <= 8) return 'TANK';
  return 'ULTIMATE';
}

function hexToText(hex: string): string {
  try {
    const bytes = hex.match(/.{1,2}/g);
    if (!bytes) return hex;
    return bytes.map((byte) => String.fromCharCode(parseInt(byte, 16))).join('');
  } catch {
    return hex;
  }
}

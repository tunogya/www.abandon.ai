import type { Virus } from '../../shared/types';

interface VirusListProps {
  viruses: Virus[];
  page?: number;     // default 1
  pageSize?: number; // default 30
}

export function VirusList({ viruses, page = 1, pageSize = 30 }: VirusListProps) {
  if (viruses.length === 0) {
    return (
      <div className="py-4 text-accents-5">
        No active viruses.
      </div>
    );
  }

  return (
    <div className="">
      <ol className="list-decimal list-inside text-accents-5" start={(page - 1) * pageSize + 1}>
        {viruses.map((virus, index) => (
          <VirusItem
            key={virus.id}
            virus={virus}
            index={(page - 1) * pageSize + index + 1}
          />
        ))}
      </ol>
    </div>
  );
}

function VirusItem({ virus, index }: { virus: Virus, index: number }) {
  const timeAgo = formatTimeAgo(new Date(virus.createdAt * 1000));
  const difficultyLabel = getDifficultyLabel(virus.difficulty);
  const memoText = virus.memo ? hexToText(virus.memo) : null;

  return (
    <li className="mb-1 leading-tight">
      {/* Title Line */}
      <span className="text-foreground font-medium mr-1 break-all">
        🦠 {virus.hash}
      </span>
      <span className="text-accents-5 text-xs">
        ({difficultyLabel})
      </span>

      {/* Meta Line */}
      <div className="text-[7pt] text-accents-4 ml-6 leading-tight break-all">
        created by {virus.createdBy} | {timeAgo} {memoText ? `| ${memoText}` : ''}
      </div>
    </li>
  );
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 4) return 'rush';
  if (difficulty <= 6) return 'balanced';
  if (difficulty <= 8) return 'tank';
  return 'ultimate';
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

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

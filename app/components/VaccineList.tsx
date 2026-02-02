import type { Vaccine } from '../../shared/types';

interface VaccineListProps {
    vaccines: Vaccine[];
}

export function VaccineList({ vaccines }: VaccineListProps) {
    if (vaccines.length === 0) {
        return (
            <div className="py-4 text-accents-5">
                No vaccines found.
            </div>
        );
    }

    return (
        <div className="">
            <ol className="list-decimal list-inside text-accents-5">
                {vaccines.map((vaccine, index) => (
                    <VaccineItem key={vaccine.id} vaccine={vaccine} index={index + 1} />
                ))}
            </ol>
        </div>
    );
}

function VaccineItem({ vaccine, index }: { vaccine: Vaccine, index: number }) {
    const timeAgo = formatTimeAgo(new Date(vaccine.createdAt * 1000));
    const successLabel = vaccine.success ? 'success' : 'failed';
    const successColor = vaccine.success ? 'text-success' : 'text-error';

    return (
        <li className="mb-1 leading-tight">
            {/* Title Line */}
            <span className="text-foreground font-medium mr-1">
                Vaccine {vaccine.hash}
            </span>
            <span className={`text-xs ${successColor}`}>
                ({successLabel})
            </span>

            {/* Meta Line */}
            <div className="text-[7pt] text-accents-4 ml-6 leading-tight">
                created by {vaccine.createdBy} | {timeAgo} | target: {vaccine.target}
            </div>
        </li>
    );
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

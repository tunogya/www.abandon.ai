import { createHash } from 'node:crypto';
import { styleText } from 'node:util';

// Colors for console output
const colors = {
    blue: (text: string) => styleText('blue', text),
    green: (text: string) => styleText('green', text),
    yellow: (text: string) => styleText('yellow', text),
    red: (text: string) => styleText('red', text),
    bold: (text: string) => styleText('bold', text),
};

interface VirusParams {
    address: string;
    difficulty: number;
    memo?: string;
}

interface MiningResult {
    address: string;
    timestamp: number;
    nonce: number;
    difficulty: number;
    memo?: string;
    hash: string;
    attempts: number;
    timeMs: number;
}

function calculateVirusHash(address: string, timestamp: number, nonce: number, difficulty: number, memo: string = ''): string {
    const data = `virus:${address}:${timestamp}:${nonce}:${difficulty}:${memo}`;
    return createHash('sha256').update(data).digest('hex');
}

function findValidNonce(
    params: VirusParams,
    targetDifficulty: number
): MiningResult {
    const startTime = Date.now();
    let timestamp = Math.floor(Date.now() / 1000);
    let nonce = 0;
    const targetPrefix = '0'.repeat(targetDifficulty);

    console.log(colors.blue(`Mining virus (difficulty ${targetDifficulty})...`));

    while (true) {
        const hash = calculateVirusHash(params.address, timestamp, nonce, params.difficulty, params.memo);

        if (hash.startsWith(targetPrefix)) {
            const endTime = Date.now();
            return {
                address: params.address,
                timestamp,
                nonce,
                difficulty: params.difficulty,
                memo: params.memo,
                hash,
                attempts: nonce + 1,
                timeMs: endTime - startTime
            };
        }

        nonce++;
        if (nonce % 100000 === 0) {
            process.stdout.write(`\rAttempts: ${formatNumber(nonce)}...`);
        }
    }
}

function formatNumber(num: number): string {
    return new Intl.NumberFormat().format(num);
}

async function submitVirus(virus: MiningResult) {
    console.log(`\nSubmitting virus...`);
    try {
        const response = await fetch('https://api.abandon.ai/api/virus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                address: virus.address,
                timestamp: virus.timestamp,
                nonce: virus.nonce,
                difficulty: virus.difficulty,
                memo: virus.memo
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const data = await response.json();
        console.log(colors.green(`✔ Success! Server response: ${JSON.stringify(data)}`));
        return true;
    } catch (error) {
        console.error(colors.red('✖ Submission failed:'), error);
        return false;
    }
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2);
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                options[key] = value;
                i++;
            }
        }
    }
    return options;
}

async function main() {
    const options = parseArgs();
    const address = options.address;
    const difficulty = parseInt(options.difficulty || '3'); // Default to 3
    const count = parseInt(options.count || '1'); // Default to 1
    const memo = options.memo || '';

    if (!address) {
        console.log(`
${colors.bold('Usage:')}
  npx tsx scripts/batch_create_viruses.ts --address <ADDRESS> [options]

${colors.bold('Options:')}
  --address     Your wallet address (required)
  --difficulty  Difficulty level (default: 3)
  --count       Number of viruses to create (default: 1)
  --memo        Optional memo
`);
        process.exit(1);
    }

    console.log(colors.bold(`Starting batch creation of ${count} viruses @ difficulty ${difficulty}`));
    console.log(`Address: ${address}`);

    let successes = 0;
    let failures = 0;

    for (let i = 0; i < count; i++) {
        console.log(colors.yellow(`\n[${i + 1}/${count}] Starting...`));

        const result = findValidNonce({ address, difficulty, memo }, difficulty);
        console.log(`\nMined! Hash: ${result.hash}`);
        console.log(`Time: ${result.timeMs}ms, Attempts: ${formatNumber(result.attempts)}`);

        const success = await submitVirus(result);
        if (success) successes++;
        else failures++;

        // Small delay to be nice to the server/logs
        if (i < count - 1) await new Promise(r => setTimeout(r, 500));
    }

    console.log(colors.bold('\n--- Batch Complete ---'));
    console.log(colors.green(`Successes: ${successes}`));
    if (failures > 0) console.log(colors.red(`Failures: ${failures}`));
}

main().catch(console.error);

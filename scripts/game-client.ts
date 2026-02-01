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

interface VaccineParams {
    address: string;
    target: string;
}

interface PoWResult {
    address: string;
    timestamp: number;
    nonce: number;
    difficulty?: number;
    memo?: string;
    target?: string;
    hash: string;
    attempts: number;
    timeMs: number;
}

function calculateVirusHash(address: string, timestamp: number, nonce: number, difficulty: number, memo: string = ''): string {
    const data = `virus:${address}:${timestamp}:${nonce}:${difficulty}:${memo}`;
    return createHash('sha256').update(data).digest('hex');
}

function calculateVaccineHash(address: string, target: string, timestamp: number, nonce: number): string {
    const data = `vaccine:${address}:${target}:${timestamp}:${nonce}`;
    return createHash('sha256').update(data).digest('hex');
}

function findValidNonce(
    mode: 'virus' | 'vaccine',
    params: VirusParams | VaccineParams,
    targetDifficulty: number
): PoWResult {
    const startTime = Date.now();
    let timestamp = Math.floor(Date.now() / 1000); // Unix seconds
    let nonce = 0;
    const targetPrefix = '0'.repeat(targetDifficulty);

    console.log(colors.blue(`Mining ${mode}...`));
    console.log(`Target Difficulty: ${colors.bold(targetDifficulty.toString())} (Prefix: "${targetPrefix}")`);

    // Reset timestamp occasionally to prevent stale mining if loop runs very long, 
    // though usually timestamp is fixed at start of mining attempt in many PoW schemes.
    // The README example updates timestamp ONCE at the start. We will stick to that.

    while (true) {
        let hash: string;
        if (mode === 'virus') {
            const p = params as VirusParams;
            hash = calculateVirusHash(p.address, timestamp, nonce, p.difficulty, p.memo);
        } else {
            const p = params as VaccineParams;
            hash = calculateVaccineHash(p.address, p.target, timestamp, nonce);
        }

        if (hash.startsWith(targetPrefix)) {
            const endTime = Date.now();
            return {
                address: params.address,
                timestamp,
                nonce,
                difficulty: (params as VirusParams).difficulty,
                memo: (params as VirusParams).memo,
                target: (params as VaccineParams).target,
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

function printUsage() {
    console.log(`
${colors.bold('Usage:')}
  npx tsx scripts/game-client.ts [command] [options]

${colors.bold('Commands:')}
  virus    Create a new virus
  vaccine  Create a vaccine for an existing virus

${colors.bold('Options (Virus):')}
  --address     Your wallet address (required)
  --difficulty  Difficulty level 3-10 (required)
  --memo        Hex encoded memo (optional)

${colors.bold('Options (Vaccine):')}
  --address     Your wallet address (required)
  --target      Target virus hash (required)
  
${colors.bold('Examples:')}
  npx tsx scripts/game-client.ts virus --address 0x123 --difficulty 4 --memo 48656c6c6f
  npx tsx scripts/game-client.ts vaccine --address 0x123 --target 0000abc...
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0) return null;

    const command = args[0];
    const options: Record<string, string> = {};

    for (let i = 1; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].substring(2); // remove --
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                options[key] = value;
                i++;
            } else {
                options[key] = 'true';
            }
        }
    }

    return { command, options };
}

async function main() {
    const parsed = parseArgs();
    if (!parsed) {
        printUsage();
        return;
    }

    const { command, options } = parsed;

    if (command === 'virus') {
        const address = options.address;
        const difficulty = parseInt(options.difficulty);
        const memo = options.memo || '';

        if (!address || isNaN(difficulty)) {
            console.error(colors.red('Error: --address and --difficulty are required for virus creation.'));
            printUsage();
            process.exit(1);
        }

        try {
            const result = findValidNonce('virus', { address, difficulty, memo }, difficulty);

            console.log('\n\n' + colors.green('✔ Virus Created Successfully!'));
            console.log(JSON.stringify(result, null, 2));

            // Show curl command
            console.log('\n' + colors.bold('Run this command to submit:'));
            console.log(`
curl -X POST https://www-abandon-ai-party.tunogya.partykit.dev/party/virus \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "${result.address}",
    "timestamp": ${result.timestamp},
    "nonce": ${result.nonce},
    "difficulty": ${result.difficulty},
    "memo": "${result.memo}"
  }'
`);

        } catch (error) {
            console.error(colors.red('Mining failed:'), error);
        }

    } else if (command === 'vaccine') {
        const address = options.address;
        const target = options.target;

        if (!address || !target) {
            console.error(colors.red('Error: --address and --target are required for vaccine creation.'));
            printUsage();
            process.exit(1);
        }

        // We need to know the difficulty of the target virus to mine a vaccine.
        // Since we don't have API access here to check, we infer it from the leading zeros of the target hash.
        let difficulty = 0;
        for (let i = 0; i < target.length; i++) {
            if (target[i] === '0') difficulty++;
            else break;
        }

        console.log(colors.yellow(`Inferred difficulty from target hash: ${difficulty}`));
        if (difficulty < 3) {
            console.warn(colors.red('Warning: Target difficulty seems too low (< 3). Is the target hash correct?'));
        }

        try {
            const result = findValidNonce('vaccine', { address, target }, difficulty);

            console.log('\n\n' + colors.green('✔ Vaccine Created Successfully!'));
            console.log(JSON.stringify(result, null, 2));

            // Show curl command
            console.log('\n' + colors.bold('Run this command to submit:'));
            console.log(`
curl -X POST https://www-abandon-ai-party.tunogya.partykit.dev/party/vaccine \\
  -H "Content-Type: application/json" \\
  -d '{
    "address": "${result.address}",
    "target": "${result.target}",
    "timestamp": ${result.timestamp},
    "nonce": ${result.nonce}
  }'
`);

        } catch (error) {
            console.error(colors.red('Mining failed:'), error);
        }

    } else {
        console.error(colors.red(`Unknown command: ${command}`));
        printUsage();
    }
}

main().catch(console.error);

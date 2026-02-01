import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { styleText } from 'node:util';

// Colors for console output
const colors = {
    blue: (text: string) => styleText('blue', text),
    green: (text: string) => styleText('green', text),
    yellow: (text: string) => styleText('yellow', text),
    red: (text: string) => styleText('red', text),
    bold: (text: string) => styleText('bold', text),
};

function printWarning() {
    console.log('\n' + colors.red(colors.bold('⚠️  SECURITY WARNING ⚠️')));
    console.log(colors.yellow('━'.repeat(60)));
    console.log(colors.yellow('• NEVER share your private key with anyone'));
    console.log(colors.yellow('• Store it securely offline (hardware wallet recommended)'));
    console.log(colors.yellow('• This key controls access to your funds'));
    console.log(colors.yellow('• Anyone with this key can access your wallet'));
    console.log(colors.yellow('━'.repeat(60)));
    console.log('');
}

function printUsage() {
    console.log(`
${colors.bold('Usage:')}
  npx tsx scripts/generate-keypair.ts

${colors.bold('Description:')}
  Generates a new Ethereum keypair (private key + address).
  The private key is generated using cryptographically secure randomness.

${colors.bold('Output:')}
  - Private Key: 0x... (64 hex characters)
  - Address: 0x... (40 hex characters, checksum format)
`);
}

async function main() {
    const args = process.argv.slice(2);

    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
        printUsage();
        return;
    }

    console.log(colors.blue(colors.bold('\n🔐 Ethereum Keypair Generator\n')));

    try {
        // Generate a random private key using secure randomness
        const privateKey = generatePrivateKey();

        // Derive the account (address) from the private key
        const account = privateKeyToAccount(privateKey);

        // Display results
        console.log(colors.green('✔ Keypair Generated Successfully!\n'));

        console.log(colors.bold('Private Key:'));
        console.log(colors.red(privateKey));
        console.log('');

        console.log(colors.bold('Address (Public):'));
        console.log(colors.green(account.address));
        console.log('');

        // Print security warning
        printWarning();

        // Additional usage hint
        console.log(colors.blue('💡 Usage Hint:'));
        console.log('Use this address with the game-client script:');
        console.log(colors.bold(`  npx tsx scripts/game-client.ts virus --address ${account.address} --difficulty 4`));
        console.log('');

    } catch (error) {
        console.error(colors.red('Error generating keypair:'), error);
        process.exit(1);
    }
}

main().catch(console.error);

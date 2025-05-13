import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, BlockheightBasedTransactionConfirmationStrategy } from '@solana/web3.js';
import axios from 'axios';

export class SolanaService {
  private connection: Connection;
  private masterPublicKey: PublicKey;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL;

    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set.');
    }

    this.connection = new Connection(rpcUrl);
    this.masterPublicKey = new PublicKey(process.env.SOLANA_MASTER_PK || "");
  }

  public async createNewSolanaWallet(): Promise<{ publicKey: string, privateKey: string }> {
    const newWallet = Keypair.generate();
    const publicKey = newWallet.publicKey.toBase58();
    const privateKey = JSON.stringify(Array.from(newWallet.secretKey));
    return { publicKey, privateKey };
  }

  public async checkSolanaPayment(address: string, expectedAmountSOL: number): Promise<boolean> {
    const publicKey = new PublicKey(address);
    const balance = await this.connection.getBalance(publicKey);
    console.log("balance: ", balance);
    const solBalance = balance / LAMPORTS_PER_SOL;

    const enoughReceived = solBalance >= expectedAmountSOL;

    return enoughReceived;
  }

  // TODO: what to do when cannot fetch sol price?
  public async convertUSDToSOL(amountUSD: number): Promise<number> {
    const solPrice = await this.fetchSolPrice();
    if (!solPrice) {
      throw new Error("Could not fetch SOL price");
    }
    return amountUSD / solPrice;
  }

  private async fetchSolPrice(): Promise<number | null> {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      return response.data.solana.usd;
    } catch (error) {
      console.error('Error fetching SOL price from Coingecko:', error);
      return null;
    }
  }

  public async aggregatePaymentToMasterWallet(sourcePrivateKey: string, amount: number): Promise<string> {
    const sourceWallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(sourcePrivateKey)));
    const lamports = amount * LAMPORTS_PER_SOL;

    // rounding to the upper lamports
    const lamportsRounded = Math.ceil(lamports);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: this.masterPublicKey,
        lamports: lamportsRounded,
      })
    );

    const maxSendRetries = 5;
    const sendRetryInterval = 2000; // 2 seconds
    const maxConfirmRetries = 5;
    const confirmRetryInterval = 2000; // 2 seconds

    let signature: string | undefined;
    let sendError: any;

    // Retry sending the transaction
    for (let i = 0; i < maxSendRetries; i++) {
      try {
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash
        console.log(`Attempt ${i + 1} to send transaction on height ${lastValidBlockHeight}`);
        signature = await this.connection.sendTransaction(transaction, [sourceWallet], {
          skipPreflight: false,
        });
        console.log(`Transaction sent with signature: ${signature}`);
        sendError = undefined; // Clear any previous send error
        break; // Exit send retry loop on success
      } catch (error) {
        sendError = error;
        console.error(`Error sending transaction on attempt ${i + 1}:`, error);
        if (i < maxSendRetries - 1) {
          console.log(`Retrying send in ${sendRetryInterval / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, sendRetryInterval));
        }
      }
    }

    if (sendError || !signature) {
      throw new Error(`Failed to send transaction after ${maxSendRetries} retries: ${sendError?.message || 'Unknown error'}`);
    }

    // Retry confirming the transaction
    for (let i = 0; i < maxConfirmRetries; i++) {
      try {
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        console.log(`Attempt ${i + 1} to confirm transaction ${signature} on height ${lastValidBlockHeight}`);
        const status = await this.connection.confirmTransaction(
          {
              signature: signature,
              blockhash: blockhash,
              lastValidBlockHeight: lastValidBlockHeight,
          },
          'confirmed'
        );

        // Check if the transaction is confirmed
        if (status.value.err === null) {
          console.log(`Transaction ${signature} confirmed.`);
          return signature; // Return signature on successful finalization
        } else {
          console.warn(`Transaction ${signature} failed to confirm on attempt ${i + 1}:`, status.value.err);
        }
      } catch (error) {
        console.error(`Error confirming transaction ${signature} on attempt ${i + 1}:`, error);
      }

      // Wait before retrying confirmation
      if (i < maxConfirmRetries - 1) {
        console.log(`Retrying confirmation for ${signature} in ${confirmRetryInterval / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, confirmRetryInterval));
      }
    }

    // If the loop finishes without returning, the transaction was not finalized
    throw new Error(`Transaction ${signature} failed to finalize after ${maxConfirmRetries} retries.`);
  }
}
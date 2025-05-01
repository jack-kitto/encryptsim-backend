import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import axios from 'axios';
 
export class SolanaService {
  private connection: Connection;
  private masterWallet: Keypair;

  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL;
    
    if (!rpcUrl) {
      throw new Error('SOLANA_RPC_URL environment variable is not set.');
    }
    
    this.connection = new Connection(rpcUrl);
  }

  public async createNewSolanaWallet(): Promise<{ publicKey: string, privateKey: string }> {
    const newWallet = Keypair.generate();
    const publicKey = newWallet.publicKey.toBase58();
    const privateKey = JSON.stringify(Array.from(newWallet.secretKey));
    return { publicKey, privateKey };
  }

  public async checkSolanaPayment(address: string, expectedAmountUSD: string): Promise<any> {

    // Convert expected amount from string to number
    const expectedAmountUSDNumber = parseFloat(expectedAmountUSD);

    const publicKey = new PublicKey(address);
    const balance = await this.connection.getBalance(publicKey);
    const solBalance = balance / LAMPORTS_PER_SOL;

    // Fetch SOL price from Coingecko
    const solPrice = await this.fetchSolPrice();
    if (!solPrice) {
      throw new Error("Could not fetch SOL price");
    }

    // Convert expected amount in USD to SOL
    const expectedAmountSOL = expectedAmountUSDNumber / solPrice;

    const enoughReceived = solBalance >= expectedAmountSOL;

    return { enoughReceived, solBalance };
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

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sourceWallet.publicKey,
        toPubkey: this.masterWallet.publicKey,
        lamports: lamports,
      })
    );

    const signature = await this.connection.sendTransaction(transaction, [sourceWallet]);
    await this.connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }
}
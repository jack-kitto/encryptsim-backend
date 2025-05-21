import { describe, expect, it } from '@jest/globals';

import { SolanaService } from '../src/services/solanaService';
import dotenv from 'dotenv';

dotenv.config();
const testPublicKey = 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76';

describe('SolanaService.checkSolanaPayment', () => {
  let solanaService: SolanaService;
  solanaService = new SolanaService(null);

  // npm test -- -t "usd-to-sol-unit"
  it('usd-to-sol-unit', async () => {
    const priceInUSD = 1.53

    const solAmount = await solanaService.convertUSDToSOL(priceInUSD);
    console.log(`${priceInUSD} $ worth of SOL is ${solAmount} SOL`);
  })

  it('should return true if the account has more than 10$ worth of SOL', async () => {
    const paymentInSol = await solanaService.convertUSDToSOL(10)
    const result = await solanaService.checkSolanaPayment(testPublicKey, paymentInSol);
    expect(result).toBe(true);
  });

  it('should return false if there is not enough balance', async () => {
      const paymentInSol = await solanaService.convertUSDToSOL(1000000)
      const result = await solanaService.checkSolanaPayment(testPublicKey, paymentInSol);

      expect(result).toBe(false);
  });

  it('should handle errors during API call and throw the error', async () => {
    const invalidAddress = 'AbcdEFgHiJkLmNoPqrStUvWxYz1234567890';
    try{
        await solanaService.checkSolanaPayment(invalidAddress, 0.005)
    }catch(error: any){
        expect(error.message).toContain("Non-base58 character");
    }
  });
});

describe('SolanaService.aggregatePaymentToMasterWallet integration test', () => {
    let solanaService: SolanaService;
    solanaService = new SolanaService(null);

    it('should aggregate payment to the master wallet and finalize the transaction', async () => {
        // --- START CUSTOM PARAMS ---
        // Replace with your actual test data for the aggregatePaymentToMasterWallet function
        // This requires a source wallet with a small amount of SOL to transfer.
        const customAggregateParams = {
            sourcePrivateKey: '[227,99,211,229,217,103,48,198,45,222,160,117,214,71,175,108,144,30,211,25,28,233,97,216,215,111,224,159,83,123,50,194,218,185,177,203,8,10,13,109,33,7,194,19,210,85,101,7,176,51,204,105,65,104,84,129,161,71,213,141,231,7,4,245]',
            amount: 0.001,
        };
        // --- END CUSTOM PARAMS ---

        // Ensure you have set the SOLANA_MASTER_PK environment variable for the SolanaService
        // Ensure the source wallet has enough SOL to cover the amount and transaction fees.

        console.log('Aggregating payment to master wallet with custom params...');

        try {
            const signature = await solanaService.aggregatePaymentToMasterWallet(
                customAggregateParams.sourcePrivateKey,
                customAggregateParams.amount
            );

            console.log(`Transaction successful with signature: ${signature}`);
            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
        } catch (error) {
            console.error('Error during aggregatePaymentToMasterWallet test:', error);
            throw error; // Re-throw the error to make the test fail
        }

    }, 60000); // Set Jest timeout for this test case to 60 seconds
});
import { describe, expect, it } from '@jest/globals';

import { SolanaService } from '../src/services/solanaService';
import dotenv from 'dotenv';

dotenv.config();
const testPublicKey = 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76';

// describe('SolanaService.checkSolanaPayment', () => {
//   let solanaService: SolanaService;
//   solanaService = new SolanaService();

//   it('should return true if the account has more than 10$ worth of SOL', async () => {
//     const result = await solanaService.checkSolanaPayment(testPublicKey, '10');
//     expect(result.enoughReceived).toBe(true);
//   });

//   it('should return false if there is not enough balance', async () => {
//       const result = await solanaService.checkSolanaPayment(testPublicKey, '1000000');

//       expect(result.enoughReceived).toBe(false);
//   });

//   it('should handle errors during API call and throw the error', async () => {
//     const invalidAddress = 'AbcdEFgHiJkLmNoPqrStUvWxYz1234567890';
//     try{
//         await solanaService.checkSolanaPayment(invalidAddress, '0.005')
//     }catch(error: any){
//         expect(error.message).toContain("Non-base58 character");
//     }
//   });
// });

describe('SolanaService.aggregatePaymentToMasterWallet integration test', () => {
    let solanaService: SolanaService;
    solanaService = new SolanaService();

    it('should aggregate payment to the master wallet and finalize the transaction', async () => {
        // --- START CUSTOM PARAMS ---
        // Replace with your actual test data for the aggregatePaymentToMasterWallet function
        // This requires a source wallet with a small amount of SOL to transfer.
        const customAggregateParams = {
            sourcePrivateKey: '[10,47,70,24,142,244,116,249,122,235,194,89,13,177,74,8,92,192,113,76,164,253,15,176,46,174,188,148,139,107,194,158,88,200,156,118,47,139,27,169,174,72,230,29,133,55,80,1,121,118,89,80,79,81,107,185,112,92,207,130,128,210,191,96]',
            amount: 2,
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
import { describe, expect, it } from '@jest/globals';

import { SolanaService } from '../src/services/solanaService';
import dotenv from 'dotenv';

dotenv.config();
const testPublicKey = 'Fip7DsE6uA9tgQcatYkWQEYfyCmcoYPSrCoTPr2SbE76';

describe('SolanaService.checkSolanaPayment', () => {
  let solanaService: SolanaService;
  solanaService = new SolanaService();

  it('should return true if the account has more than 10$ worth of SOL', async () => {
    const result = await solanaService.checkSolanaPayment(testPublicKey, '10');
    expect(result.enoughReceived).toBe(true);
  });

  it('should return false if there is not enough balance', async () => {
      const result = await solanaService.checkSolanaPayment(testPublicKey, '1000000');

      expect(result.enoughReceived).toBe(false);
  });

  it('should handle errors during API call and throw the error', async () => {
    const invalidAddress = 'AbcdEFgHiJkLmNoPqrStUvWxYz1234567890';
    try{
        await solanaService.checkSolanaPayment(invalidAddress, '0.005')
    }catch(error: any){
        expect(error.message).toContain("Non-base58 character");
    }
  });
});
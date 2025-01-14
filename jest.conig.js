import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { TokenValidator } from '../src/validators/token-validator';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';

describe('TokenValidator', () => {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    let validator;

    beforeEach(() => {
        validator = new TokenValidator(connection);
    });

    it('should reject invalid mint addresses', async () => {
        const result = await validator.validateToken('not-a-valid-address');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle a real devnet token', async () => {
        // Using devnet USDC address
        const result = await validator.validateToken('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        expect(result.errors.length).toBe(0);
    });
});
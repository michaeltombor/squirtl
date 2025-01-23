// src/services/pool-service.ts
import { IAgentRuntime, Memory } from '@elizaos/core';
import { PoolConfig, PoolHealth } from '../types/pool';
import { TokenValidation } from '../types/token';
import { ServiceType } from '@elizaos/core';

export class PoolService {
    constructor(private runtime: IAgentRuntime) { }

    async validateToken(mintAddress: string): Promise<TokenValidation> {
        const solanaService = this.runtime.getService('solana');
        if (!solanaService) throw new Error('Solana service not available');

        const metadata = await solanaService.getTokenMetadata(mintAddress);
        const holders = await solanaService.getTokenHolders(mintAddress);

        const validation = {
            isValid: true,
            metadata: {
                name: metadata.name,
                symbol: metadata.symbol,
                holders: holders.length,
                totalSupply: metadata.supply
            },
            riskScore: 0
        };

        await this.runtime.messageManager.createMemory({
            content: {
                text: `Token validation for ${mintAddress}: ${JSON.stringify(validation)}`,
                action: 'TOKEN_VALIDATION'
            },
            roomId: this.runtime.agentId,
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId
        } as Memory);

        return validation;
    }

    async createPool(config: PoolConfig): Promise<string> {
        const solanaService = this.runtime.getService('solana');
        if (!solanaService) throw new Error('Solana service not available');

        const validation = await this.validateToken(config.tokenMint);
        if (!validation.isValid) throw new Error('Token validation failed');

        const poolAddress = await solanaService.createPool(config);

        await this.runtime.messageManager.createMemory({
            content: {
                text: `Pool created at ${poolAddress}`,
                action: 'POOL_CREATION',
                poolAddress,
                config
            },
            roomId: this.runtime.agentId,
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId
        } as Memory);

        return poolAddress;
    }

    async checkPoolHealth(poolAddress: string): Promise<PoolHealth> {
        const solanaService = this.runtime.getService('solana');
        if (!solanaService) throw new Error('Solana service not available');

        const health = await solanaService.getPoolMetrics(poolAddress);

        await this.runtime.messageManager.createMemory({
            content: {
                text: `Pool health check for ${poolAddress}: ${JSON.stringify(health)}`,
                action: 'POOL_HEALTH_CHECK',
                poolAddress,
                health
            },
            roomId: this.runtime.agentId,
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId
        } as Memory);

        return health;
    }
}
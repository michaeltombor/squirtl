// src/services/pool-service.ts
import { IAgentRuntime, Memory, Service } from '@elizaos/core';
import { PoolConfig, PoolHealth } from '../types/pool';
import { TokenValidation, TokenMetadata } from '../types/token';
import { ServiceType } from '../types/service';

interface ISolanaPlugin extends Service {
    getTokenMetadata(mintAddress: string): Promise<TokenMetadata>;
    getTokenHolders(mintAddress: string): Promise<string[]>;
    createPool(config: PoolConfig): Promise<string>;
    getPoolMetrics(poolAddress: string): Promise<PoolHealth>;
}

interface ITEEService extends Service {
    executeSecure<T>(operation: () => Promise<T>): Promise<T>;
}

export class PoolService {
    constructor(private runtime: IAgentRuntime) { }

    async validateToken(mintAddress: string): Promise<TokenValidation> {
        const solanaPlugin = this.runtime.getService<ISolanaPlugin>(ServiceType.SOLANA);
        const teeService = this.runtime.getService<ITEEService>(ServiceType.TEE);

        if (!solanaPlugin || !teeService) {
            throw new Error('Required services not available');
        }

        // Execute validation in TEE
        const validation = await teeService.executeSecure(async () => {
            const metadata = await solanaPlugin.getTokenMetadata(mintAddress);
            const holders = await solanaPlugin.getTokenHolders(mintAddress);

            return {
                isValid: true, // Add validation logic
                metadata: {
                    name: metadata.name,
                    symbol: metadata.symbol,
                    holders: holders.length,
                    totalSupply: metadata.supply
                },
                riskScore: 0 // Add risk scoring logic
            };
        });

        // Store validation result in agent memory
        await this.runtime.messageManager.createMemory({
            content: {
                text: `Token validation for ${mintAddress}: ${JSON.stringify(validation)}`,
                action: 'TOKEN_VALIDATION'
            },
            roomId: this.runtime.agentId,
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId, // Adding required agentId
        } as Memory);

        return validation;
    }

    async createPool(config: PoolConfig): Promise<string> {
        const solanaPlugin = this.runtime.getService<ISolanaPlugin>(ServiceType.SOLANA);
        const teeService = this.runtime.getService<ITEEService>(ServiceType.TEE);

        if (!solanaPlugin || !teeService) {
            throw new Error('Required services not available');
        }

        // Validate configuration in TEE
        await teeService.executeSecure(async () => {
            const validation = await this.validateToken(config.tokenMint);
            if (!validation.isValid) {
                throw new Error('Token validation failed');
            }
        });

        // Create pool using Raydium SDK
        const poolAddress = await solanaPlugin.createPool(config);

        // Store pool creation in agent memory
        await this.runtime.messageManager.createMemory({
            content: {
                text: `Pool created at ${poolAddress}`,
                action: 'POOL_CREATION',
                poolAddress,
                config
            },
            roomId: this.runtime.agentId,
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId, // Adding required agentId
        } as Memory);

        return poolAddress;
    }

    async checkPoolHealth(poolAddress: string): Promise<PoolHealth> {
        const solanaPlugin = this.runtime.getService<ISolanaPlugin>(ServiceType.SOLANA);

        if (!solanaPlugin) {
            throw new Error('Solana service not available');
        }

        const health = await solanaPlugin.getPoolMetrics(poolAddress);

        // Store health check in agent memory
        await this.runtime.messageManager.createMemory({
            content: {
                text: `Pool health check for ${poolAddress}: ${JSON.stringify(health)}`,
                action: 'POOL_HEALTH_CHECK',
                poolAddress,
                health
            },
            roomId: this.runtime.agentId,
            userId: this.runtime.agentId,
            agentId: this.runtime.agentId, // Adding required agentId
        } as Memory);

        return health;
    }
}
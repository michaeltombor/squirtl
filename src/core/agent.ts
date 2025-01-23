// src/core/agent.ts
import { IAgentRuntime } from '@elizaos/core';
import { SquirtlMemoryManager } from './memory';
import { PoolService } from '../services/pool-service';
import { PoolConfig, PoolHealth } from '../types/pool';
import { TokenValidation } from '../types/token';

export interface ISquirtlAgent {
    validateToken(mintAddress: string): Promise<TokenValidation>;
    createPool(config: PoolConfig): Promise<string>;
    checkPoolHealth(poolAddress: string): Promise<PoolHealth>;
}

export class SquirtlAgent implements ISquirtlAgent {
    private memoryManager: SquirtlMemoryManager;
    private poolService: PoolService;

    constructor(private runtime: IAgentRuntime) {
        this.memoryManager = new SquirtlMemoryManager(runtime);
        this.poolService = new PoolService(runtime);
    }

    async initialize(): Promise<void> {
        await this.runtime.initialize();
        await this.loadCharacterConfig();
        await this.memoryManager.initialize();
    }

    async validateToken(mintAddress: string): Promise<TokenValidation> {
        return this.poolService.validateToken(mintAddress);
    }

    async createPool(config: PoolConfig): Promise<string> {
        return this.poolService.createPool(config);
    }

    async checkPoolHealth(poolAddress: string): Promise<PoolHealth> {
        return this.poolService.checkPoolHealth(poolAddress);
    }

    private async loadCharacterConfig(): Promise<void> {
        const character = this.runtime.character;
        if (!character) {
            throw new Error('Character configuration not found');
        }

        await this.memoryManager.storeAgentInfo({
            name: character.name,
            bio: Array.isArray(character.bio) ? character.bio : [character.bio],
            capabilities: character.plugins.map(p => p.name)
        });
    }
}
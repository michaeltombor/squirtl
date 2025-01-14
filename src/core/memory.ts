// src/core/memory.ts
import {
    IAgentRuntime,
    Memory,
    IMemoryManager
} from '@elizaos/core';
import { PoolConfig, PoolHealth } from '../types';

export class SquirtlMemoryManager {
    private messageManager: IMemoryManager;
    private loreManager: IMemoryManager;
    private poolDataManager: IMemoryManager;

    constructor(private runtime: IAgentRuntime) {
        this.messageManager = runtime.messageManager;
        this.loreManager = runtime.loreManager;
        this.poolDataManager = runtime.getMemoryManager('pool_data');
    }

    async initialize(): Promise<void> {
        // Ensure memory tables exist
        await this.runtime.ensureConnection(
            this.runtime.agentId,
            'pool_data'
        );
    }

    async storeAgentInfo(info: {
        name: string;
        bio: string[];
        capabilities: string[];
    }): Promise<void> {
        await this.loreManager.createMemory({
            content: {
                text: JSON.stringify(info),
                type: 'agent_info'
            },
            userId: this.runtime.agentId,
            roomId: this.runtime.agentId,
            unique: true
        });
    }

    async storePoolCreation(config: PoolConfig, poolAddress: string): Promise<void> {
        await this.poolDataManager.createMemory({
            content: {
                text: JSON.stringify({
                    action: 'POOL_CREATION',
                    config,
                    poolAddress,
                    timestamp: new Date().toISOString()
                }),
                type: 'pool_creation'
            },
            userId: this.runtime.agentId,
            roomId: this.runtime.agentId
        });
    }

    async storePoolHealth(poolAddress: string, health: PoolHealth): Promise<void> {
        await this.poolDataManager.createMemory({
            content: {
                text: JSON.stringify({
                    action: 'POOL_HEALTH_CHECK',
                    poolAddress,
                    health,
                    timestamp: new Date().toISOString()
                }),
                type: 'pool_health'
            },
            userId: this.runtime.agentId,
            roomId: this.runtime.agentId
        });
    }

    async getPoolHistory(poolAddress: string): Promise<Memory[]> {
        return await this.poolDataManager.searchMemoriesByEmbedding(
            await this.runtime.embed(poolAddress),
            {
                match_threshold: 0.95,
                count: 100,
                roomId: this.runtime.agentId
            }
        );
    }

    async getRecentPools(limit: number = 10): Promise<Memory[]> {
        return await this.poolDataManager.getMemories({
            roomId: this.runtime.agentId,
            count: limit,
            unique: true
        });
    }
}
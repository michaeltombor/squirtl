// src/core/memory.ts
import {
    IAgentRuntime,
    Memory,
    IMemoryManager
} from '@elizaos/core';
import { PoolConfig, PoolHealth } from '../types/pool.js';

// Add constants for memory types
const MEMORY_TYPES = {
    POOL_DATA: 'pool-data-0000-0000-0001',
    AGENT_INFO: 'agent_info',
    POOL_CREATION: 'pool_creation',
    POOL_HEALTH: 'pool_health'
} as const;

export class SquirtlMemoryManager {
    private messageManager: IMemoryManager;
    private loreManager: IMemoryManager;
    private poolDataManager: IMemoryManager;

    constructor(private runtime: IAgentRuntime) {
        this.messageManager = runtime.messageManager;
        this.loreManager = runtime.loreManager;
        const poolDataManager = runtime.getMemoryManager(MEMORY_TYPES.POOL_DATA);
        if (!poolDataManager) {
            throw new Error('Failed to initialize pool data manager');
        }
        this.poolDataManager = poolDataManager;
    }

    async initialize(): Promise<void> {
        try {
            await this.runtime.ensureConnection(
                this.runtime.agentId,
                MEMORY_TYPES.POOL_DATA
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to initialize memory system: ${message}`);
        }
    }

    private createBaseMemory(content: any): Memory {
        return {
            content,
            userId: this.runtime.agentId,
            roomId: this.runtime.agentId,
            agentId: this.runtime.agentId,
            createdAt: Date.now()
        } as Memory;
    }

    async storeAgentInfo(info: {
        name: string;
        bio: string[];
        capabilities: string[];
    }): Promise<void> {
        const memory = this.createBaseMemory({
            text: JSON.stringify(info),
            type: MEMORY_TYPES.AGENT_INFO
        });
        await this.loreManager.createMemory({ ...memory, unique: true });
    }

    async storePoolCreation(config: PoolConfig, poolAddress: string): Promise<void> {
        const memory = this.createBaseMemory({
            text: JSON.stringify({
                action: 'POOL_CREATION',
                config,
                poolAddress,
                timestamp: new Date().toISOString()
            }),
            type: MEMORY_TYPES.POOL_CREATION
        });
        await this.poolDataManager.createMemory(memory);
    }

    async storePoolHealth(poolAddress: string, health: PoolHealth): Promise<void> {
        const memory = this.createBaseMemory({
            text: JSON.stringify({
                action: 'POOL_HEALTH_CHECK',
                poolAddress,
                health,
                timestamp: new Date().toISOString()
            }),
            type: MEMORY_TYPES.POOL_HEALTH
        });
        await this.poolDataManager.createMemory(memory);
    }

    async getPoolHistory(poolAddress: string): Promise<Memory[]> {
        try {
            const memories = await this.poolDataManager.getMemories({
                roomId: this.runtime.agentId,
                count: 100
            });

            return memories.filter(memory => {
                try {
                    const content = JSON.parse(memory.content.text);
                    return content.poolAddress === poolAddress;
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`Failed to parse memory content: ${message}`);
                    return false;
                }
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to fetch pool history: ${message}`);
        }
    }

    async getRecentPools(limit: number = 10): Promise<Memory[]> {
        try {
            return await this.poolDataManager.getMemories({
                roomId: this.runtime.agentId,
                count: limit,
                unique: true
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to fetch recent pools: ${message}`);
        }
    }
}
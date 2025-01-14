// src/types/memory.ts
import { IMemoryManager, Memory } from '@elizaos/core';
import { PoolConfig, PoolHealth } from './pool';  // We'll create this file

export interface AgentMemory {
    messageManager: IMemoryManager;  // For conversation history
    loreManager: IMemoryManager;     // For static knowledge
    poolDataManager: IMemoryManager; // For pool-specific data
}

export interface PoolMemory extends Memory {
    content: {
        text: string;
        action: 'POOL_CREATION' | 'POOL_HEALTH_CHECK';
        poolAddress: string;
        timestamp: string;
        config?: PoolConfig;
        health?: PoolHealth;
    };
}
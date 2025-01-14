// src/core/agent.ts
import { IAgentRuntime, Character, Memory } from '@elizaos/core';
import { SquirtlMemoryManager } from './memory';
import { PoolService } from '../services/pool-service';

export class SquirtlAgent {
    private memoryManager: SquirtlMemoryManager;
    private poolService: PoolService;

    constructor(private runtime: IAgentRuntime) {
        this.memoryManager = new SquirtlMemoryManager(runtime);
        this.poolService = new PoolService(runtime);
    }

    async initialize(): Promise<void> {
        // Initialize required services and plugins
        await this.runtime.initialize();

        // Load character configuration
        await this.loadCharacterConfig();

        // Initialize memory systems
        await this.memoryManager.initialize();
    }

    private async loadCharacterConfig(): Promise<void> {
        // Load and validate character configuration
        const character = this.runtime.character;
        if (!character) {
            throw new Error('Character configuration not found');
        }

        // Store character info in memory
        await this.memoryManager.storeAgentInfo({
            name: character.name,
            bio: Array.isArray(character.bio) ? character.bio : [character.bio],
            capabilities: character.plugins.map(p => p.name)
        });
    }
}
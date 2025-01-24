// src/agents/finplan/index.ts
import { AgentRuntime, ModelProviderName, CacheManager } from "@elizaos/core";
import { financialDataEvaluator } from './evaluators/financial-data';
import { financialProfileProvider } from './providers/financial-plan';
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import { MemoryCacheAdapter } from "@elizaos/core";
import { createNodePlugin } from "@elizaos/plugin-node";
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';

export async function initializeFinPlan() {
    // Initialize cache manager
    const cache = new CacheManager(new MemoryCacheAdapter());

    // Load character configuration
    const character = require('./character.json');

    return new AgentRuntime({
        // Required core configuration
        databaseAdapter: db,
        token: process.env.ANTHROPIC_API_KEY || "",
        modelProvider: character.modelProvider,
        character,

        // Core plugins
        plugins: [
            bootstrapPlugin,
            createNodePlugin()
        ].filter(Boolean),

        // Our custom components
        evaluators: [financialDataEvaluator],
        providers: [financialProfileProvider],
        actions: [],

        // Required managers
        cacheManager: cache,
        services: [],
        managers: [],

        // Optional configuration
        conversationLength: 32,
        logging: true
    });
}

// Declare db with a specific type
let db: SqliteDatabaseAdapter;

export function setDatabaseAdapter(adapter: SqliteDatabaseAdapter) {
    db = adapter;
}
// tests/core/agent.test.ts
import { IAgentRuntime, ModelProviderName, Character, Clients } from '@elizaos/core';
import { SquirtlAgent } from '../../src/core/agent';
import { PoolConfig, PoolHealth } from '../../src/types/pool';

describe('SquirtlAgent', () => {
    let mockRuntime: IAgentRuntime;
    let agent: SquirtlAgent;

    beforeEach(() => {
        const mockMemoryManager = {
            runtime: {} as IAgentRuntime,
            tableName: 'test',
            createMemory: jest.fn().mockResolvedValue(undefined),
            getMemories: jest.fn().mockResolvedValue([]),
            searchMemoriesByEmbedding: jest.fn().mockResolvedValue([]),
            addEmbeddingToMemory: jest.fn().mockResolvedValue(undefined),
            getCachedEmbeddings: jest.fn().mockResolvedValue([]),
            countMemories: jest.fn().mockResolvedValue(0),
            removeMemory: jest.fn().mockResolvedValue(undefined),
            removeAllMemories: jest.fn().mockResolvedValue(undefined),
            getMemoryById: jest.fn().mockResolvedValue(null),
            getMemoriesByRoomIds: jest.fn().mockResolvedValue([])
        };

        const mockCharacter: Character = {
            name: 'Squirtl',
            modelProvider: ModelProviderName.ANTHROPIC,
            clients: [Clients.DIRECT, Clients.DISCORD, Clients.TELEGRAM],
            bio: ['Test bio'],
            lore: ['Test lore'],
            messageExamples: [],
            postExamples: [],
            style: {
                all: [],
                chat: [],
                post: []
            },
            plugins: [
                { name: '@elizaos/plugin-solana', description: 'Solana plugin' },
                { name: '@elizaos/plugin-tee', description: 'TEE plugin' }
            ],
            settings: { model: 'claude-3-opus-20240229' }
        };

        mockRuntime = {
            agentId: 'test-agent-id' as `${string}-${string}-${string}-${string}-${string}`,
            serverUrl: 'http://localhost:7998',
            databaseAdapter: {} as any,
            token: 'test-token',
            modelProvider: ModelProviderName.ANTHROPIC,
            imageModelProvider: ModelProviderName.ANTHROPIC,
            character: mockCharacter,
            plugins: [],
            services: new Map(),
            clients: {},
            initialize: jest.fn().mockResolvedValue(undefined),
            messageManager: mockMemoryManager,
            loreManager: mockMemoryManager,
            getMemoryManager: jest.fn().mockReturnValue(mockMemoryManager),
            ensureConnection: jest.fn().mockResolvedValue(undefined),
            getService: jest.fn().mockReturnValue({
                getTokenMetadata: jest.fn().mockResolvedValue({}),
                getTokenHolders: jest.fn().mockResolvedValue([]),
                createPool: jest.fn().mockResolvedValue('pool-address'),
                getPoolMetrics: jest.fn().mockResolvedValue({})
            }),
            registerMemoryManager: jest.fn(),
            composeState: jest.fn(),
            updateRecentMessageState: jest.fn(),
            evaluate: jest.fn(),
            ensureUserExists: jest.fn(),
            ensureParticipantExists: jest.fn(),
            ensureParticipantInRoom: jest.fn(),
            processActions: jest.fn(),
            ensureRoomExists: jest.fn(),
            imageVisionModelProvider: ModelProviderName.ANTHROPIC,
            providers: [],
            actions: [],
            evaluators: [],
            knowledgeManager: mockMemoryManager,
            documentsManager: mockMemoryManager,
            cacheManager: {} as any,
            getSetting: jest.fn(),
            getConversationLength: jest.fn()
        };

        agent = new SquirtlAgent(mockRuntime);
    });

    test('initializes correctly', async () => {
        await agent.initialize();
        expect(mockRuntime.initialize).toHaveBeenCalled();
    });
});
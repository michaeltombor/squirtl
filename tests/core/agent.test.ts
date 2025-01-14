// tests/core/agent.test.ts
import { IAgentRuntime, Character } from '@elizaos/core';
import { SquirtlAgent } from '../../src/core/agent';

describe('SquirtlAgent', () => {
    let mockRuntime: IAgentRuntime;
    let agent: SquirtlAgent;

    beforeEach(() => {
        // Mock ElizaOS runtime
        mockRuntime = {
            agentId: 'test-agent-id',
            character: {
                name: 'Squirtl',
                bio: ['Test bio'],
                plugins: [
                    { name: '@elizaos/plugin-solana' },
                    { name: '@elizaos/plugin-tee' }
                ]
            },
            initialize: jest.fn().mockResolvedValue(undefined),
            messageManager: {
                createMemory: jest.fn().mockResolvedValue(undefined),
                getMemories: jest.fn().mockResolvedValue([]),
            },
            loreManager: {
                createMemory: jest.fn().mockResolvedValue(undefined),
                getMemories: jest.fn().mockResolvedValue([]),
            },
            getMemoryManager: jest.fn().mockReturnValue({
                createMemory: jest.fn().mockResolvedValue(undefined),
                getMemories: jest.fn().mockResolvedValue([]),
            }),
            ensureConnection: jest.fn().mockResolvedValue(undefined)
        } as unknown as IAgentRuntime;

        agent = new SquirtlAgent(mockRuntime);
    });

    test('should initialize agent correctly', async () => {
        await agent.initialize();

        // Verify runtime initialization
        expect(mockRuntime.initialize).toHaveBeenCalled();

        // Verify character info storage
        expect(mockRuntime.loreManager.createMemory).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.objectContaining({
                    text: expect.stringContaining('Squirtl')
                }),
                userId: 'test-agent-id',
                roomId: 'test-agent-id',
                unique: true
            })
        );
    });
});

// tests/core/memory.test.ts
import { IAgentRuntime, Memory } from '@elizaos/core';
import { SquirtlMemoryManager } from '../../src/core/memory';
import { PoolConfig, PoolHealth } from '../../src/types';

describe('SquirtlMemoryManager', () => {
    let mockRuntime: IAgentRuntime;
    let memoryManager: SquirtlMemoryManager;

    beforeEach(() => {
        mockRuntime = {
            agentId: 'test-agent-id',
            messageManager: {
                createMemory: jest.fn().mockResolvedValue(undefined),
                getMemories: jest.fn().mockResolvedValue([]),
            },
            loreManager: {
                createMemory: jest.fn().mockResolvedValue(undefined),
                getMemories: jest.fn().mockResolvedValue([]),
            },
            getMemoryManager: jest.fn().mockReturnValue({
                createMemory: jest.fn().mockResolvedValue(undefined),
                getMemories: jest.fn().mockResolvedValue([]),
                searchMemoriesByEmbedding: jest.fn().mockResolvedValue([]),
            }),
            embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
            ensureConnection: jest.fn().mockResolvedValue(undefined)
        } as unknown as IAgentRuntime;

        memoryManager = new SquirtlMemoryManager(mockRuntime);
    });

    test('should initialize memory system', async () => {
        await memoryManager.initialize();
        expect(mockRuntime.ensureConnection).toHaveBeenCalledWith(
            'test-agent-id',
            'pool_data'
        );
    });

    test('should store pool creation', async () => {
        const poolConfig: PoolConfig = {
            tokenMint: 'token123',
            baseTokenMint: 'base123',
            initialPrice: 1.0,
            initialLiquidity: 1000
        };
        const poolAddress = 'pool123';

        await memoryManager.storePoolCreation(poolConfig, poolAddress);

        const poolDataManager = mockRuntime.getMemoryManager('pool_data');
        expect(poolDataManager.createMemory).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.objectContaining({
                    text: expect.stringContaining(poolAddress)
                }),
                userId: 'test-agent-id',
                roomId: 'test-agent-id'
            })
        );
    });

    test('should store and retrieve pool health', async () => {
        const poolAddress = 'pool123';
        const health: PoolHealth = {
            liquidity: 1000,
            volume24h: 500,
            priceChange24h: 0.1,
            numHolders: 100,
            trustScore: 0.8
        };

        await memoryManager.storePoolHealth(poolAddress, health);

        const poolDataManager = mockRuntime.getMemoryManager('pool_data');
        expect(poolDataManager.createMemory).toHaveBeenCalledWith(
            expect.objectContaining({
                content: expect.objectContaining({
                    text: expect.stringContaining(poolAddress)
                })
            })
        );

        // Test retrieval
        const history = await memoryManager.getPoolHistory(poolAddress);
        expect(mockRuntime.embed).toHaveBeenCalledWith(poolAddress);
        expect(poolDataManager.searchMemoriesByEmbedding).toHaveBeenCalled();
    });
});
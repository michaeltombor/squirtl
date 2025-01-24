// src/index.ts
import { IAgentRuntime } from '@elizaos/core';
import { setDatabaseAdapter, initializeFinPlan } from './agents/finplan';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import { FinancialProfile } from './shared/types/financial';

// Set up interface for our agent system
interface AgentSystem {
    finplan: IAgentRuntime;
}

// Declare db at the module level
let db: SqliteDatabaseAdapter;

async function initializeDatabase() {
    db = new SqliteDatabaseAdapter({
        // SQLite configuration for development
        filename: "./data.sqlite",
        tables: {
            // Define our custom tables
            financialProfiles: `
                CREATE TABLE IF NOT EXISTS financialProfiles (
                    id TEXT PRIMARY KEY,
                    userId TEXT NOT NULL,
                    content TEXT NOT NULL,
                    createdAt INTEGER NOT NULL,
                    updatedAt INTEGER NOT NULL
                )
            `,
            financialClaims: `
                CREATE TABLE IF NOT EXISTS financialClaims (
                    id TEXT PRIMARY KEY,
                    userId TEXT NOT NULL,
                    type TEXT NOT NULL,
                    value REAL NOT NULL,
                    createdAt INTEGER NOT NULL
                )
            `
        }
    });

    // Initialize database
    await db.init();
    return db;
}

async function initializeAgents(): Promise<AgentSystem> {
    // Initialize and set database
    const db = await initializeDatabase();
    setDatabaseAdapter(db);

    // Initialize FinPlan agent
    const finplan = await initializeFinPlan();

    return { finplan };
}

async function main() {
    try {
        console.log('Initializing Financial Planning Agent...');
        const agents = await initializeAgents();

        // Set up memory monitoring for financial data
        const memoryManager = agents.finplan.messageManager;

        // Monitor for new financial data
        setInterval(async () => {
            const memories = await memoryManager.getMemories({
                roomId: agents.finplan.agentId,
                count: 10,
                unique: true
            });

            memories.forEach(memory => {
                if (memory.content.type === 'financial_claim') {
                    try {
                        const claim = JSON.parse(memory.content.text);
                        console.log(`New financial data for user ${memory.userId}:`, claim);
                    } catch (e) {
                        console.error('Error parsing financial claim:', e);
                    }
                }
            });
        }, 5000); // Check every 5 seconds

        // Log startup success
        console.log('Financial Planning Agent Ready!');
        console.log('Listening for financial queries...');

        // Keep process alive
        process.on('SIGINT', async () => {
            console.log('Shutting down...');
            await db.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to initialize agents:', error);
        process.exit(1);
    }
}

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Start the application
main().catch(console.error);
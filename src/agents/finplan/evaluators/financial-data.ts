// src/agents/finplan/evaluators/financial-data.ts
import {
    ActionExample,
    Evaluator,
    IAgentRuntime,
    Memory,
    ModelClass,
    generateObjectArray,
    composeContext
} from "@elizaos/core";
import { stringToUuid } from "@elizaos/core";
import { FinancialProfile, FinancialClaim } from "../../../shared/types/financial";

const REQUIRED_FIELDS = {
    income: ['annual'],
    savings: ['current', 'monthly'],
    housingGoal: ['targetPrice']
};

const extractionTemplate = `TASK: Extract financial information from the conversation as an array of claims in JSON format.

Recent Messages:
{{recentMessages}}

Extract any financial claims from the conversation:
- Set the claim type to 'income', 'savings', 'expense', 'goal', or 'investment'
- Include values in numbers only (no currency symbols)
- Set timeframe to 'monthly', 'annual', or 'total' where applicable
- Set a confidence score between 0 and 1

Response should be in a JSON block like this:
\`\`\`json
[
  {"claim": string, "type": string, "category": string, "value": number, "timeframe": string, "confidence": number},
  ...
]
\`\`\``;

export const financialDataEvaluator: Evaluator = {
    name: "EXTRACT_FINANCIAL_DATA",
    similes: ["GET_FINANCIAL_INFO", "GET_MONEY_INFO"],
    description: "Extract financial information from conversations for home buying planning",

    validate: async (runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
        // Don't process agent's own messages
        if (message.userId === runtime.agentId) {
            return false;
        }

        // Check if we already have complete data
        const cacheKey = `${runtime.character.name}/${message.userId}/financialProfile`;
        const cached = await runtime.cacheManager.get<FinancialProfile>(cacheKey);

        return !cached?.complete;
    },

    handler: async (runtime: IAgentRuntime, message: Memory) => {
        const state = await runtime.composeState(message);

        // Generate context for extraction
        const context = composeContext({
            state,
            template: extractionTemplate,
        });

        // Extract financial claims using generateObjectArray like in facts example
        const claims = await generateObjectArray({
            runtime,
            context,
            modelClass: ModelClass.MEDIUM,
        }) as FinancialClaim[];

        if (!claims || claims.length === 0) {
            return false;
        }

        // Get or initialize profile
        const cacheKey = `${runtime.character.name}/${message.userId}/financialProfile`;
        let profile = await runtime.cacheManager.get<FinancialProfile>(cacheKey) || {
            complete: false
        };

        // Process each claim
        for (const claim of claims) {
            if (claim.confidence < 0.8) continue;

            // Store in memory system
            await runtime.messageManager.createMemory({
                id: stringToUuid(Date.now().toString()),
                content: {
                    text: JSON.stringify(claim),
                    type: "financial_claim"
                },
                userId: message.userId,
                roomId: message.roomId,
                agentId: runtime.agentId,
                createdAt: Date.now(),
                unique: true
            });

            // Update profile based on claim type
            switch (claim.type) {
                case 'income':
                    if (claim.timeframe === 'annual') {
                        profile.income = profile.income || {};
                        profile.income.annual = claim.value;
                    }
                    break;
                case 'savings':
                    profile.savings = profile.savings || {};
                    if (claim.timeframe === 'total') {
                        profile.savings.current = claim.value;
                    } else if (claim.timeframe === 'monthly') {
                        profile.savings.monthly = claim.value;
                    }
                    break;
                case 'goal':
                    if (claim.category === 'house') {
                        profile.housingGoal = profile.housingGoal || {};
                        profile.housingGoal.targetPrice = claim.value;
                    }
                    break;
            }
        }

        // Check if we have all required fields
        profile.complete = Object.entries(REQUIRED_FIELDS).every(([category, fields]) =>
            fields.every(field =>
                (profile[category as keyof FinancialProfile] as any)?.[field] !== undefined
            )
        );

        // Update cache
        await runtime.cacheManager.set(cacheKey, profile);

        return true;
    },

    examples: [
        {
            context: "User sharing financial information",
            messages: [
                {
                    user: "{{user1}}",
                    content: { text: "I make $120,000 per year and save about $2,000 monthly" }
                }
            ] as ActionExample[],
            outcome: `\`\`\`json
            [
                {
                    "claim": "User earns $120,000 annually",
                    "type": "income",
                    "category": "salary",
                    "value": 120000,
                    "timeframe": "annual",
                    "confidence": 1.0
                },
                {
                    "claim": "User saves $2,000 monthly",
                    "type": "savings",
                    "category": "regular",
                    "value": 2000,
                    "timeframe": "monthly",
                    "confidence": 1.0
                }
            ]
            \`\`\``
        }
    ]
};
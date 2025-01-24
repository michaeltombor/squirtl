// src/agents/finplan/providers/financial-plan.ts
import {
    IAgentRuntime,
    Memory,
    Provider,
    State,
    formatMessages
} from "@elizaos/core";
import { FinancialProfile } from "../../../shared/types/financial";

export const financialProfileProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        const cacheKey = `${runtime.character.name}/${message.userId}/financialProfile`;

        // Get current profile from cache
        const profile = await runtime.cacheManager.get<FinancialProfile>(cacheKey);

        if (!profile) {
            return `I'll help you plan for buying a home. First, I need some information about your finances. Could you tell me:
1. Your annual income
2. How much you can save monthly
3. Your target home price`;
        }

        // If we have complete information
        if (profile.complete) {
            const monthlyPayment = calculateEstimatedPayment(
                profile.housingGoal?.targetPrice || 0,
                profile.savings?.current || 0
            );

            return formatCompleteProfile(profile, monthlyPayment);
        }

        // Show current info and what's missing
        return formatIncompleteProfile(profile);
    }
};

function calculateEstimatedPayment(homePrice: number, currentSavings: number): number {
    const downPayment = Math.min(currentSavings, homePrice * 0.20);
    const loanAmount = homePrice - downPayment;
    const annualRate = 0.07; // 7% annual interest
    const monthlyRate = annualRate / 12;
    const terms = 30 * 12; // 30 years in months

    return Math.round(
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, terms)) /
        (Math.pow(1 + monthlyRate, terms) - 1)
    );
}

function formatCompleteProfile(profile: FinancialProfile, monthlyPayment: number): string {
    return `Based on your information:

Income & Savings:
• Annual Income: $${profile.income?.annual?.toLocaleString()}
• Current Savings: $${profile.savings?.current?.toLocaleString()}
• Monthly Savings: $${profile.savings?.monthly?.toLocaleString()}

Home Purchase Goal:
• Target Price: $${profile.housingGoal?.targetPrice?.toLocaleString()}
• Estimated Monthly Payment: $${monthlyPayment.toLocaleString()}
  (principal & interest only)

Would you like to:
1. Review affordability analysis
2. Discuss saving strategy
3. Learn about mortgage options
4. Understand additional costs`;
}

function formatIncompleteProfile(profile: FinancialProfile): string {
    const missing: string[] = [];

    if (!profile.income?.annual) {
        missing.push("annual income");
    }
    if (!profile.savings?.monthly) {
        missing.push("monthly savings capacity");
    }
    if (!profile.housingGoal?.targetPrice) {
        missing.push("target home price");
    }

    let output = "Here's what I know so far:\n\n";

    if (profile.income?.annual) {
        output += `• Annual Income: $${profile.income.annual.toLocaleString()}\n`;
    }
    if (profile.savings?.current) {
        output += `• Current Savings: $${profile.savings.current.toLocaleString()}\n`;
    }
    if (profile.housingGoal?.targetPrice) {
        output += `• Target Home Price: $${profile.housingGoal.targetPrice.toLocaleString()}\n`;
    }

    output += `\nI still need to know your ${missing.join(", ")}.`;
    return output;
}
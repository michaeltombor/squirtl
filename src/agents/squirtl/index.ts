// src/agents/squirtl/index.ts
import { AgentRuntime } from "@elizaos/core";

export async function initializeSquirtl() {
    const runtime = new AgentRuntime({
        modelProvider: "anthropic",
        token: process.env.ANTHROPIC_API_KEY || "",
        // Add Squirtl-specific actions and providers
        actions: [],
        providers: [],
        evaluators: []
    });

    await runtime.initialize();
    return runtime;
}
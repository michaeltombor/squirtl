// src/types/token.ts
export interface TokenValidation {
    isValid: boolean;
    reasons?: string[];
    metadata?: TokenMetadata;
    riskScore: number;
}

export interface TokenMetadata {
    name: string;
    symbol: string;
    holders: number;
    totalSupply: number;
}
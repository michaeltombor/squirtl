// src/types/pool.ts
export interface PoolConfig {
    tokenMint: string;
    baseTokenMint: string;
    initialPrice: number;
    initialLiquidity: number;
}

export interface PoolHealth {
    liquidity: number;
    volume24h: number;
    priceChange24h: number;
    numHolders: number;
    trustScore: number;
}
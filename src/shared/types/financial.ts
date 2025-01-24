// src/shared/types/financial.ts

export interface FinancialProfile {
    income: {
        annual?: number;
        monthlyTakeHome?: number;
        employmentStability?: string;
        careerTrajectory?: string;
    };
    expenses: {
        monthlyTotal?: number;
        breakdown?: Record<string, number>;
        debtPayments?: Record<string, number>;
    };
    credit: {
        score?: number;
        history?: string;
    };
    savings: {
        current?: number;
        monthly?: number;
        investments?: Record<string, number>;
    };
    housingGoal: {
        targetPrice?: number;
        timeline?: string;
        purpose?: 'primary' | 'investment';
        downPayment?: number;
        maxMonthlyPayment?: number;
        location?: string;
    };
    complete: boolean;
}

export interface HousingPlan {
    monthlyPayment: number;
    downPaymentNeeded: number;
    timeToDownPayment: number;
    recommendedSavings: number;
    affordabilityRatio: number;
    recommendations: string[];
}
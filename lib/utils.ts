import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculatePersonalRDA(
  nutrient: { perKgLowerMg?: number; perKgUpperMg?: number },
  userWeight: number
) {
  const lowerBound = (nutrient.perKgLowerMg || 0) * userWeight;
  const upperBound = (nutrient.perKgUpperMg || 0) * userWeight;
  return { lowerBound, upperBound };
}

export function calculateCoverage(
  actualAmount: number,
  recommendedAmount: number
) {
  if (recommendedAmount === 0) return 0;
  return Math.min((actualAmount / recommendedAmount) * 100, 100);
}

export function formatNutrientAmount(amount: number, unit: string): string {
  if (unit === 'μg' || unit === 'mcg') {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}mg`;
    }
  }
  return `${amount.toFixed(1)}${unit}`;
}

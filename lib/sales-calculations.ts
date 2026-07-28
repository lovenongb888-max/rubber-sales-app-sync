export type NumericInput = number | string;

export function parseNumericInput(value: NumericInput): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(value, 0) : 0;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("-")) {
    return 0;
  }

  const normalized = trimmed.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
}

export function calculateTotalWeight(weights: NumericInput[]): number {
  return weights.reduce<number>((total, weight) => total + parseNumericInput(weight), 0);
}

export function calculateTotalAmount(weights: NumericInput[], pricePerKg: NumericInput): number {
  return calculateTotalWeight(weights) * parseNumericInput(pricePerKg);
}

export interface SaleSummaryInput {
  totalWeight: number;
  totalAmount: number;
}

export function calculateWeightedAverage(records: SaleSummaryInput[]): number {
  const totalWeight = records.reduce((sum, record) => sum + Math.max(record.totalWeight, 0), 0);
  const totalAmount = records.reduce((sum, record) => sum + Math.max(record.totalAmount, 0), 0);

  return totalWeight > 0 ? totalAmount / totalWeight : 0;
}

export function formatQuantity(value: number, fractionDigits = 2): string {
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

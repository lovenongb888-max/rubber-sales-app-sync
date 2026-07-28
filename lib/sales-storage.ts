import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SaleRecord {
  id: string;
  soldAt: string;
  displayDate: string;
  displayTime: string;
  pricePerKg: number;
  basketWeights: number[];
  totalWeight: number;
  totalAmount: number;
  createdAt: string;
}

const STORAGE_KEY = "rubber-sales-records-v1";

function isSaleRecord(value: unknown): value is SaleRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<SaleRecord>;
  return (
    typeof record.id === "string" &&
    typeof record.soldAt === "string" &&
    typeof record.displayDate === "string" &&
    typeof record.displayTime === "string" &&
    typeof record.pricePerKg === "number" &&
    Array.isArray(record.basketWeights) &&
    record.basketWeights.every((weight) => typeof weight === "number") &&
    typeof record.totalWeight === "number" &&
    typeof record.totalAmount === "number" &&
    typeof record.createdAt === "string"
  );
}

export async function loadSaleRecords(): Promise<SaleRecord[]> {
  const rawValue = await AsyncStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isSaleRecord)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  } catch {
    return [];
  }
}

export async function saveSaleRecords(records: SaleRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

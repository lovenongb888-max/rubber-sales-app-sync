import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => storage.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
  },
}));

import { loadSaleRecords, saveSaleRecords, type SaleRecord } from "../lib/sales-storage";

const olderRecord: SaleRecord = {
  id: "sale-older",
  soldAt: "2026-07-27T09:00:00.000Z",
  displayDate: "27/07/2026",
  displayTime: "16:00",
  pricePerKg: 50,
  basketWeights: [10, 12],
  totalWeight: 22,
  totalAmount: 1100,
  createdAt: "2026-07-27T09:00:00.000Z",
};

const latestRecord: SaleRecord = {
  ...olderRecord,
  id: "sale-latest",
  displayDate: "28/07/2026",
  createdAt: "2026-07-28T09:00:00.000Z",
};

describe("sales storage", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("บันทึกและเรียงรายการขายล่าสุดไว้ก่อน", async () => {
    await saveSaleRecords([olderRecord, latestRecord]);

    await expect(loadSaleRecords()).resolves.toEqual([latestRecord, olderRecord]);
  });

  it("คืนค่ารายการว่างเมื่อข้อมูลยังไม่มีหรือข้อมูลเสียหาย", async () => {
    await expect(loadSaleRecords()).resolves.toEqual([]);

    storage.set("rubber-sales-records-v1", "not-valid-json");
    await expect(loadSaleRecords()).resolves.toEqual([]);
  });

  it("ตัดข้อมูลที่ไม่สอดคล้องกับแบบจำลองรายการขายออก", async () => {
    storage.set(
      "rubber-sales-records-v1",
      JSON.stringify([olderRecord, { id: "incomplete" }]),
    );

    await expect(loadSaleRecords()).resolves.toEqual([olderRecord]);
  });
});

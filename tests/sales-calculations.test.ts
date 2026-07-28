import { describe, expect, it } from "vitest";

import {
  calculateTotalAmount,
  calculateTotalWeight,
  calculateWeightedAverage,
  parseNumericInput,
} from "../lib/sales-calculations";

describe("sales calculations", () => {
  it("แปลงข้อมูลตัวเลขและป้องกันค่าติดลบ", () => {
    expect(parseNumericInput("52.75")).toBe(52.75);
    expect(parseNumericInput("52,75")).toBe(52.75);
    expect(parseNumericInput("-40")).toBe(0);
    expect(parseNumericInput("abc")).toBe(0);
  });

  it("รวมค่าน้ำหนักของทุกเข่งอย่างถูกต้อง", () => {
    expect(calculateTotalWeight(["12.5", "10", 7.25])).toBe(29.75);
  });

  it("คำนวณยอดขายจากน้ำหนักรวมและราคา", () => {
    expect(calculateTotalAmount(["12.5", "10", 7.25], "50")).toBe(1487.5);
  });

  it("คำนวณราคาเฉลี่ยแบบถ่วงน้ำหนัก", () => {
    const average = calculateWeightedAverage([
      { totalWeight: 10, totalAmount: 500 },
      { totalWeight: 30, totalAmount: 1800 },
    ]);

    expect(average).toBe(57.5);
  });

  it("คืนค่าเป็นศูนย์เมื่อน้ำหนักสะสมเป็นศูนย์", () => {
    expect(calculateWeightedAverage([{ totalWeight: 0, totalAmount: 800 }])).toBe(0);
  });
});

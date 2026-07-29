import { jsPDF } from "jspdf";

export interface ReceiptData {
  date: string; // DD/MM/YYYY format
  time: string; // HH:MM format
  pricePerKg: number;
  quantity: number;
  totalWeight: number;
  totalAmount: number;
  notes?: string;
}

/**
 * Generate a receipt slip PDF
 * Creates a compact receipt in Thai language
 */
export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a6", // Small receipt size (105 x 148 mm)
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 5;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin + 5;

  // Set font
  doc.setFont("courier");

  // Header
  doc.setFontSize(14);
  doc.setFont("courier", "bold");
  doc.text("ใบเสร็จรับเงิน", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  // Divider
  doc.setDrawColor(0);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  // Receipt details
  doc.setFontSize(9);
  doc.setFont("courier", "normal");

  // Date and time
  doc.text(`วันที่: ${data.date}`, margin, yPosition);
  yPosition += 5;
  doc.text(`เวลา: ${data.time}`, margin, yPosition);
  yPosition += 6;

  // Divider
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  // Details table
  const details = [
    ["ราคา/กก.", `${data.pricePerKg.toFixed(2)} บาท`],
    ["จำนวนเข่ง", `${data.quantity} เข่ง`],
    ["น้ำหนักรวม", `${data.totalWeight.toFixed(2)} กก.`],
  ];

  details.forEach(([label, value]) => {
    doc.text(label, margin, yPosition);
    doc.text(value, pageWidth - margin - 25, yPosition, { align: "right" });
    yPosition += 5;
  });

  yPosition += 2;

  // Divider
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  // Total amount (highlighted)
  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.text("ยอดรวม:", margin, yPosition);
  doc.text(`${data.totalAmount.toFixed(2)} บาท`, pageWidth - margin - 15, yPosition, {
    align: "right",
  });
  yPosition += 7;

  // Divider
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 4;

  // Notes if provided
  if (data.notes) {
    doc.setFontSize(8);
    doc.text("หมายเหตุ:", margin, yPosition);
    yPosition += 3;
    const notesLines = doc.splitTextToSize(data.notes, contentWidth - 2);
    doc.text(notesLines, margin + 1, yPosition);
    yPosition += notesLines.length * 3 + 2;
  }

  // Footer
  yPosition = pageHeight - margin - 5;
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text("ระบบบันทึกการขายยางพารา", pageWidth / 2, yPosition, { align: "center" });

  return doc;
}

/**
 * Download receipt PDF
 */
export function downloadReceiptPDF(data: ReceiptData, filename?: string): void {
  const doc = generateReceiptPDF(data);
  const defaultFilename = `receipt-${data.date.replace(/\//g, "-")}-${data.time.replace(":", "-")}.pdf`;
  doc.save(filename || defaultFilename);
}

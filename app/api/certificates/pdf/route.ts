import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;

export const runtime = "nodejs";

type CertificateInput = {
  student: string;
  course: string;
  code: string;
  issuedAt: string;
  instructor: string;
  template: string;
  hours: string;
  score: string;
  verifyUrl: string;
};

function normalizeText(value: string | null, fallback: string, limit = 140) {
  return (value?.trim() || fallback).replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").slice(0, limit);
}

function formatCertificateDate(value: string | null) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date());
  }

  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(date);
}

function color(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function yFromTop(top: number, height = 0) {
  return PAGE_HEIGHT - top - height;
}

function drawRect(
  page: PDFPage,
  top: number,
  left: number,
  width: number,
  height: number,
  options: { fill?: string; border?: string; borderWidth?: number } = {}
) {
  page.drawRectangle({
    x: left,
    y: yFromTop(top, height),
    width,
    height,
    color: options.fill ? color(options.fill) : undefined,
    borderColor: options.border ? color(options.border) : undefined,
    borderWidth: options.borderWidth ?? (options.border ? 1 : undefined)
  });
}

function drawText(page: PDFPage, text: string, x: number, top: number, size: number, font: PDFFont, hex = "#0f172a") {
  page.drawText(text, { x, y: yFromTop(top, size), size, font, color: color(hex) });
}

function drawCentered(
  page: PDFPage,
  text: string,
  top: number,
  size: number,
  font: PDFFont,
  hex = "#0f172a",
  centerX = PAGE_WIDTH / 2
) {
  const width = font.widthOfTextAtSize(text, size);
  drawText(page, text, centerX - width / 2, top, size, font, hex);
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function drawLabel(page: PDFPage, label: string, value: string, x: number, top: number, width: number, regular: PDFFont, bold: PDFFont) {
  drawText(page, label.toUpperCase(), x, top, 8, regular, "#64748b");
  const lines = wrapText(value, bold, 10, width);
  lines.forEach((line, index) => drawText(page, line, x, top + 16 + index * 12, 10, bold, "#0f172a"));
}

async function buildCertificatePdf(input: CertificateInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoPath = path.join(process.cwd(), "public", "icons", "logo.png");
  const logoBuffer = fs.existsSync(logoPath) ? fs.readFileSync(logoPath) : null;
  const logoImage = logoBuffer ? await pdf.embedPng(logoBuffer) : null;
  const qrBuffer = await QRCode.toBuffer(input.verifyUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 132,
    color: { dark: "#062f2f", light: "#ffffff" }
  });
  const qrImage = await pdf.embedPng(qrBuffer);

  drawRect(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, { fill: "#f8fafc" });
  drawRect(page, 34, 34, PAGE_WIDTH - 68, PAGE_HEIGHT - 68, { border: "#0f766e", borderWidth: 1.2 });
  drawRect(page, 48, 48, PAGE_WIDTH - 96, PAGE_HEIGHT - 96, { border: "#cbd5e1", borderWidth: 0.6 });
  drawRect(page, 48, 48, 6, PAGE_HEIGHT - 96, { fill: "#0f766e" });
  drawRect(page, 48, 54, 2, PAGE_HEIGHT - 96, { fill: "#14b8a6" });
  drawRect(page, 62, 72, 76, 54, { fill: "#ffffff", border: "#e2e8f0", borderWidth: 0.8 });

  if (logoImage) {
    page.drawImage(logoImage, { x: 84, y: yFromTop(72, 34), width: 52, height: 34 });
  } else {
    drawText(page, "MR", 96, 75, 18, bold, "#6d28d9");
  }

  drawText(page, "MR CREATIVIST", 164, 70, 15, bold);
  drawText(page, "VERIFIED DIGITAL CREDENTIAL", 164, 92, 8, bold, "#0f766e");
  drawText(page, `Credential code: ${input.code}`, 596, 70, 8, regular, "#64748b");
  drawText(page, "Status: Verified original", 622, 90, 9, bold, "#0f766e");
  page.drawLine({ start: { x: 92, y: yFromTop(138) }, end: { x: 750, y: yFromTop(138) }, thickness: 1, color: color("#e2e8f0") });

  drawCentered(page, "CERTIFICATE OF COMPLETION", 168, 12, bold, "#475569");
  drawCentered(page, "This certifies that", 207, 12, regular, "#475569");
  drawCentered(page, input.student, 230, input.student.length > 30 ? 28 : 36, bold, "#020617");
  page.drawLine({ start: { x: 250, y: yFromTop(286) }, end: { x: 592, y: yFromTop(286) }, thickness: 1.3, color: color("#0f766e") });
  drawCentered(page, "has successfully completed the professional learning program", 306, 12, regular, "#475569");
  const courseSize = input.course.length > 46 ? 22 : 26;
  wrapText(input.course, bold, courseSize, 618).forEach((line, index) =>
    drawCentered(page, line, 334 + index * (courseSize + 4), courseSize, bold, "#0f766e")
  );

  drawRect(page, 414, 82, 504, 92, { fill: "#f1f5f9", border: "#dbe4ee", borderWidth: 0.8 });
  drawLabel(page, "Instructor", input.instructor, 106, 433, 150, regular, bold);
  drawLabel(page, "Learning hours", input.hours, 280, 433, 120, regular, bold);
  drawLabel(page, "Final score", input.score, 424, 433, 120, regular, bold);
  drawLabel(page, "Issued date", input.issuedAt, 106, 473, 180, regular, bold);
  drawLabel(page, "Template", input.template, 310, 473, 110, regular, bold);
  drawLabel(page, "Verification", input.code, 444, 473, 118, regular, bold);

  drawRect(page, 390, 620, 142, 142, { fill: "#ffffff", border: "#dbe4ee", borderWidth: 0.8 });
  page.drawImage(qrImage, { x: 629, y: yFromTop(399, 124), width: 124, height: 124 });
  drawCentered(page, "SCAN TO VERIFY", 540, 8, bold, "#0f172a", 691);

  return pdf.save();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const issuedAt = normalizeText(formatCertificateDate(searchParams.get("issuedAt")), formatCertificateDate(null));
  const code = normalizeText(searchParams.get("code"), `MRC-${new Date().getFullYear()}-PREVIEW`, 48);
  const certificateParams = new URLSearchParams(searchParams);
  certificateParams.delete("download");
  certificateParams.set("code", code);
  const verifyUrl = `${origin}/api/certificates/pdf?${certificateParams.toString()}`;
  const certificate = {
    student: normalizeText(searchParams.get("student"), "MR Creativist Learner"),
    course: normalizeText(searchParams.get("course"), "Professional Learning Program", 180),
    code,
    issuedAt,
    instructor: normalizeText(searchParams.get("instructor"), "MR Creativist Instructor"),
    template: normalizeText(searchParams.get("template"), "Professional"),
    hours: normalizeText(searchParams.get("hours"), "42 hours"),
    score: normalizeText(searchParams.get("score"), "96%"),
    verifyUrl
  };
  const bytes = await buildCertificatePdf(certificate);
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const fileName = `${certificate.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}

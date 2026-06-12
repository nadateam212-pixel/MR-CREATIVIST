import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { brand } from "@/lib/brand";
import { escapeHtml, sendEmail } from "@/lib/email";
import { connectMongoDB } from "@/lib/mongodb";
import { absoluteUrl } from "@/lib/site-url";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Order from "@/models/Order";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

type BillItem = {
  name: string;
  quantity: number;
  amount: number;
};

type BillData = {
  billNo: string;
  title: string;
  buyerName: string;
  buyerEmail: string;
  buyerContact: string;
  buyerAddress: string;
  productName: string;
  courseName: string;
  amount: number;
  currency: "USD" | "FRW";
  status: string;
  paymentMethod: string;
  reference: string;
  paidAt: Date;
  items: BillItem[];
};

type LooseRecord = Record<string, unknown>;

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

function asRecord(value: unknown): LooseRecord {
  return value && typeof value === "object" ? (value as LooseRecord) : {};
}

function firstClean(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function addressText(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim();

  const record = asRecord(value);
  const parts = [
    record.address,
    record.addressLine1,
    record.line1,
    record.street,
    record.city,
    record.state,
    record.province,
    record.country,
    record.postalCode
  ]
    .map((item) => clean(item))
    .filter(Boolean);

  return Array.from(new Set(parts)).join(", ");
}

function money(value: number, currency: string) {
  if (currency === "FRW") {
    return `FRW ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value ?? 0)))}`;
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));
}

function invoiceDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function statusColor(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes("pending")) return rgb(0.78, 0.43, 0.04);
  if (normalized.includes("fail") || normalized.includes("cancel") || normalized.includes("refund")) return rgb(0.78, 0.11, 0.11);
  return rgb(0.05, 0.52, 0.25);
}

function truncateText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const value = clean(text, "N/A");
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;

  let output = value;
  while (output.length > 1 && font.widthOfTextAtSize(`${output}...`, size) > maxWidth) {
    output = output.slice(0, -1);
  }

  return `${output.trim()}...`;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2) {
  const words = clean(text, "N/A").split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
      continue;
    }

    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (words.join(" ") !== lines.join(" ")) {
    const last = lines.at(-1) ?? "";
    lines[lines.length - 1] = truncateText(last, font, size, maxWidth);
  }

  return lines;
}

function drawLabelValue({
  page,
  label,
  value,
  x,
  y,
  width,
  labelFont,
  valueFont,
  muted,
  dark
}: {
  page: PDFPage;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
  labelFont: PDFFont;
  valueFont: PDFFont;
  muted: ReturnType<typeof rgb>;
  dark: ReturnType<typeof rgb>;
}) {
  page.drawText(label.toUpperCase(), { x, y, size: 8, font: labelFont, color: muted });
  for (const [index, line] of wrapText(value, valueFont, 10, width, 2).entries()) {
    page.drawText(line, { x, y: y - 15 - index * 13, size: 10, font: valueFont, color: dark });
  }
}

async function embedLogo(pdf: PDFDocument) {
  try {
    const logo = await readFile(join(process.cwd(), "public", "icons", "logo.png"));
    return pdf.embedPng(logo);
  } catch {
    return null;
  }
}

async function orderBill(transaction: LooseRecord): Promise<Partial<BillData>> {
  const order = transaction.referenceId ? await Order.findById(String(transaction.referenceId)).lean() : null;
  if (!order) return {};

  const metadata = asRecord(order.metadata);
  const firstItem = order.items?.[0];

  return {
    title: "Marketplace purchase bill",
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
    buyerContact: firstClean(metadata.buyerPhone, metadata.phone, transaction.mobilePhone),
    buyerAddress: firstClean(
      addressText(metadata.billingAddress),
      addressText(metadata.shippingAddress),
      addressText(metadata.address)
    ),
    productName: clean(firstItem?.name, "Marketplace product"),
    paymentMethod: order.paymentMethod,
    reference: order.paymentReference || transaction.providerReference || transaction.referenceId,
    items: (order.items ?? []).map((item: LooseRecord) => ({
      name: clean(item.name, "Marketplace item"),
      quantity: Number(item.quantity ?? 1),
      amount: Number(item.unitPrice ?? 0) * Number(item.quantity ?? 1)
    }))
  };
}

async function enrollmentBill(transaction: LooseRecord): Promise<Partial<BillData>> {
  const metadata = asRecord(transaction.metadata);
  const enrollment =
    transaction.referenceId && transaction.referenceId !== transaction.requestTransactionId
      ? await Enrollment.findById(String(transaction.referenceId)).lean()
      : null;
  const courseId = enrollment?.courseId ?? metadata.courseId;
  const course = courseId ? await Course.findById(String(courseId)).lean() : null;
  const courseName = clean(course?.title ?? metadata.courseTitle, "Course enrollment");

  return {
    title: "Course enrollment bill",
    buyerName: enrollment?.learnerName ?? metadata.learnerName ?? transaction.userEmail,
    buyerEmail: enrollment?.learnerEmail ?? metadata.learnerEmail ?? transaction.userEmail,
    buyerContact: firstClean(metadata.mobilePhone, metadata.phone, transaction.mobilePhone),
    buyerAddress: firstClean(addressText(metadata.billingAddress), addressText(metadata.address), metadata.location),
    courseName,
    paymentMethod: clean(metadata.paymentMethod ?? metadata.provider ?? transaction.type, "Payment"),
    reference: clean(transaction.providerReference || transaction.referenceId || transaction.requestTransactionId),
    items: [
      {
        name: courseName,
        quantity: 1,
        amount: Number(transaction.amount ?? 0)
      }
    ]
  };
}

export async function getPaymentBillData(transactionId: string): Promise<BillData> {
  await connectMongoDB();

  const transaction = await WalletTransaction.findById(transactionId).lean();
  if (!transaction) throw new Error("Payment transaction not found.");
  const metadata = asRecord(transaction.metadata);

  const related =
    transaction.referenceType === "order"
      ? await orderBill(transaction)
      : transaction.referenceType === "enrollment" || metadata.payableType === "course_enrollment"
        ? await enrollmentBill(transaction)
        : {};

  const paidAt = transaction.updatedAt ?? transaction.createdAt ?? new Date();
  const buyerEmail = clean(related.buyerEmail ?? transaction.counterpartyEmail ?? transaction.userEmail);
  const buyerProfile = buyerEmail
    ? await User.findOne({ email: buyerEmail }).select("phone location").lean()
    : null;
  const buyerName = firstClean(related.buyerName, buyerEmail.split("@")[0], "MR Creativist customer");
  const productName = clean(related.productName ?? metadata.productName ?? metadata.productTitle);
  const courseName = clean(related.courseName ?? metadata.courseTitle);

  return {
    billNo: `MRC-${String(transaction._id).slice(-8).toUpperCase()}`,
    title: clean(related.title, "MR Creativist payment bill"),
    buyerName,
    buyerEmail,
    buyerContact: firstClean(related.buyerContact, buyerProfile?.phone, metadata.mobilePhone, metadata.phone, transaction.mobilePhone, "Not provided"),
    buyerAddress: firstClean(related.buyerAddress, buyerProfile?.location, addressText(metadata.billingAddress), addressText(metadata.address), "Not provided"),
    productName: productName || (courseName ? "" : clean(transaction.description, "MR Creativist product")),
    courseName,
    amount: Number(transaction.amount ?? 0),
    currency: transaction.currency === "USD" ? "USD" : "FRW",
    status: clean(transaction.status, "completed"),
    paymentMethod: clean(related.paymentMethod ?? metadata.paymentMethod ?? metadata.method ?? transaction.type, "Payment"),
    reference: clean(related.reference ?? transaction.providerReference ?? transaction.requestTransactionId ?? transaction.referenceId, String(transaction._id)),
    paidAt: new Date(paidAt),
    items: related.items?.length
      ? related.items
      : [
          {
            name: clean(transaction.description, "MR Creativist payment"),
            quantity: 1,
            amount: Number(transaction.amount ?? 0)
          }
        ]
  };
}

export async function renderPaymentBillPdf(data: BillData) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf);
  const dark = rgb(0.05, 0.08, 0.12);
  const muted = rgb(0.34, 0.42, 0.52);
  const lightBlue = rgb(0.93, 0.96, 1);
  const blue = rgb(0.08, 0.27, 0.68);
  let y = 790;

  page.drawRectangle({ x: 0, y: 710, width: 595, height: 132, color: blue });
  if (logo) {
    page.drawRectangle({ x: 48, y: 756, width: 54, height: 54, color: rgb(1, 1, 1), borderColor: rgb(0.75, 0.84, 1), borderWidth: 1 });
    page.drawImage(logo, { x: 55, y: 763, width: 40, height: 40 });
  }
  page.drawText(brand.name, { x: 118, y, size: 24, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Official payment bill", { x: 118, y: y - 24, size: 11, font: regular, color: rgb(0.82, 0.89, 1) });
  page.drawText(`Bill ${data.billNo}`, { x: 404, y, size: 15, font: bold, color: rgb(1, 1, 1) });
  page.drawText(invoiceDate(data.paidAt), { x: 404, y: y - 22, size: 9, font: regular, color: rgb(0.82, 0.89, 1) });
  page.drawText(`${brand.email}  |  ${brand.phones.join("  |  ")}`, { x: 48, y: 728, size: 8.5, font: regular, color: rgb(0.82, 0.89, 1) });
  y = 668;

  page.drawRectangle({ x: 48, y: y - 154, width: 499, height: 154, color: lightBlue, borderColor: rgb(0.78, 0.86, 0.98), borderWidth: 1 });
  page.drawText("Client details", { x: 68, y: y - 24, size: 12, font: bold, color: blue });
  page.drawText("Payment details", { x: 344, y: y - 24, size: 12, font: bold, color: blue });

  drawLabelValue({ page, label: "Client name", value: data.buyerName, x: 68, y: y - 48, width: 220, labelFont: bold, valueFont: regular, muted, dark });
  drawLabelValue({ page, label: "Client contact", value: data.buyerContact, x: 68, y: y - 91, width: 220, labelFont: bold, valueFont: regular, muted, dark });
  drawLabelValue({ page, label: "Address", value: data.buyerAddress, x: 68, y: y - 130, width: 220, labelFont: bold, valueFont: regular, muted, dark });

  drawLabelValue({ page, label: "Status", value: data.status.toUpperCase(), x: 344, y: y - 48, width: 160, labelFont: bold, valueFont: bold, muted, dark: statusColor(data.status) });
  drawLabelValue({ page, label: "Method", value: data.paymentMethod, x: 344, y: y - 91, width: 160, labelFont: bold, valueFont: regular, muted, dark });
  drawLabelValue({ page, label: "Reference", value: data.reference, x: 344, y: y - 130, width: 160, labelFont: bold, valueFont: regular, muted, dark });
  y -= 190;

  const productOrCourse = data.courseName || data.productName || data.items[0]?.name || "MR Creativist item";
  page.drawRectangle({ x: 48, y: y - 58, width: 499, height: 58, color: rgb(1, 1, 1), borderColor: rgb(0.84, 0.88, 0.94), borderWidth: 1 });
  page.drawText(data.courseName ? "Course name" : "Product name", { x: 68, y: y - 22, size: 8, font: bold, color: muted });
  page.drawText(truncateText(productOrCourse, bold, 13, 445), { x: 68, y: y - 42, size: 13, font: bold, color: dark });
  y -= 96;

  page.drawText("Item", { x: 48, y, size: 10, font: bold, color: muted });
  page.drawText("Qty", { x: 386, y, size: 10, font: bold, color: muted });
  page.drawText("Amount", { x: 470, y, size: 10, font: bold, color: muted });
  y -= 16;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: rgb(0.84, 0.88, 0.93) });
  y -= 24;

  for (const item of data.items.slice(0, 12)) {
    for (const [index, line] of wrapText(item.name, regular, 10.5, 310, 2).entries()) {
      page.drawText(line, { x: 48, y: y - index * 13, size: 10.5, font: regular, color: dark });
    }
    page.drawText(String(item.quantity), { x: 390, y, size: 10.5, font: regular, color: dark });
    page.drawText(truncateText(money(item.amount, data.currency), regular, 10.5, 90), { x: 452, y, size: 10.5, font: regular, color: dark });
    y -= 34;
  }

  y -= 8;
  page.drawLine({ start: { x: 330, y }, end: { x: 547, y }, thickness: 1, color: rgb(0.84, 0.88, 0.93) });
  y -= 28;
  page.drawText("Total paid", { x: 352, y, size: 14, font: bold, color: dark });
  page.drawText(truncateText(money(data.amount, data.currency), bold, 14, 110), { x: 452, y, size: 14, font: bold, color: dark });
  y -= 48;

  page.drawRectangle({ x: 48, y: 76, width: 499, height: 68, color: rgb(0.98, 0.99, 1), borderColor: rgb(0.88, 0.91, 0.96), borderWidth: 1 });
  page.drawText("Questions about this bill?", { x: 68, y: 118, size: 11, font: bold, color: dark });
  page.drawText(`Contact ${brand.email} or ${brand.phones[0]}.`, { x: 68, y: 99, size: 9.5, font: regular, color: muted });
  page.drawText(`Issued by ${brand.name}, ${brand.address}. Thank you for choosing Mr Creativist.`, { x: 48, y: 50, size: 9, font: regular, color: muted });

  return Buffer.from(await pdf.save());
}

export async function sendPaymentBillEmail(transactionId: string) {
  const data = await getPaymentBillData(transactionId);
  if (!data.buyerEmail) return null;

  const pdf = await renderPaymentBillPdf(data);
  const total = money(data.amount, data.currency);
  const productOrCourse = data.courseName || data.productName || data.items[0]?.name || "MR Creativist payment";
  const logoUrl = absoluteUrl(brand.logo);
  const itemRows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5edf8">${escapeHtml(item.name)}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5edf8;text-align:center">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5edf8;text-align:right">${escapeHtml(money(item.amount, data.currency))}</td>
        </tr>
      `
    )
    .join("");

  return sendEmail({
    to: data.buyerEmail,
    subject: `${data.title} ${data.billNo}`,
    text: `Hi ${data.buyerName}, your ${brand.name} bill ${data.billNo} is attached. Item: ${productOrCourse}. Total: ${total}. Reference: ${data.reference}. Support: ${brand.email}.`,
    html: `
      <div style="margin:0;background:#f3f7fc;padding:28px 0;font-family:Arial,Helvetica,sans-serif;color:#101827">
        <div style="margin:0 auto;max-width:640px;background:#ffffff;border:1px solid #dbe7f5;border-radius:16px;overflow:hidden">
          <div style="background:#0f4fd0;padding:26px 32px;color:#ffffff">
            <img src="${logoUrl}" width="58" height="58" alt="${escapeHtml(brand.name)}" style="display:block;border-radius:12px;background:#ffffff;padding:5px;margin-bottom:16px" />
            <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#cfe0ff">Payment bill attached</div>
            <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff">${escapeHtml(data.billNo)}</h1>
          </div>
          <div style="padding:30px 32px">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#334155">Hi ${escapeHtml(data.buyerName)}, your ${escapeHtml(brand.name)} payment bill is attached as a PDF.</p>
            <div style="border:1px solid #dbe7f5;border-radius:12px;padding:16px;background:#f8fbff;margin-bottom:20px">
              <p style="margin:0 0 8px;font-size:14px"><strong>Client:</strong> ${escapeHtml(data.buyerName)} (${escapeHtml(data.buyerEmail)})</p>
              <p style="margin:0 0 8px;font-size:14px"><strong>Contact:</strong> ${escapeHtml(data.buyerContact)}</p>
              <p style="margin:0 0 8px;font-size:14px"><strong>Address:</strong> ${escapeHtml(data.buyerAddress)}</p>
              <p style="margin:0 0 8px;font-size:14px"><strong>${data.courseName ? "Course" : "Product"}:</strong> ${escapeHtml(productOrCourse)}</p>
              <p style="margin:0;font-size:14px"><strong>Reference:</strong> ${escapeHtml(data.reference)}</p>
            </div>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;color:#334155">
              <thead>
                <tr>
                  <th align="left" style="padding:0 0 10px;color:#64748b">Item</th>
                  <th align="center" style="padding:0 0 10px;color:#64748b">Qty</th>
                  <th align="right" style="padding:0 0 10px;color:#64748b">Amount</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
            <p style="margin:22px 0 0;text-align:right;font-size:18px;color:#101827"><strong>Total: ${escapeHtml(total)}</strong></p>
          </div>
          <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5edf8;font-size:12px;line-height:1.8;color:#64748b">
            Need help? Contact <a href="mailto:${brand.email}" style="color:#1d5bd8;font-weight:700;text-decoration:none">${brand.email}</a> or call ${escapeHtml(brand.phones.join(" / "))}.<br />
            ${escapeHtml(brand.name)} · ${escapeHtml(brand.address)}
          </div>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `${data.billNo}.pdf`,
        content: pdf,
        contentType: "application/pdf"
      }
    ],
    headers: {
      "X-MRCreativist-Purpose": "payment-bill"
    }
  });
}

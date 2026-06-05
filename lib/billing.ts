import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sendEmail } from "@/lib/email";
import { connectMongoDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import Order from "@/models/Order";
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

function money(value: number, currency: string) {
  if (currency === "FRW") {
    return `FRW ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(Number(value ?? 0)))}`;
  }

  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));
}

function invoiceDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

async function orderBill(transaction: LooseRecord): Promise<Partial<BillData>> {
  const order = transaction.referenceId ? await Order.findById(String(transaction.referenceId)).lean() : null;
  if (!order) return {};

  return {
    title: "Marketplace purchase bill",
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
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

  return {
    title: "Course enrollment bill",
    buyerName: enrollment?.learnerName ?? metadata.learnerName ?? transaction.userEmail,
    buyerEmail: enrollment?.learnerEmail ?? metadata.learnerEmail ?? transaction.userEmail,
    paymentMethod: clean(metadata.paymentMethod ?? metadata.provider ?? transaction.type, "Payment"),
    reference: clean(transaction.providerReference || transaction.referenceId || transaction.requestTransactionId),
    items: [
      {
        name: clean(course?.title ?? metadata.courseTitle, "Course enrollment"),
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
  const buyerName = clean(related.buyerName ?? buyerEmail.split("@")[0], "MR Creativist customer");

  return {
    billNo: `MRC-${String(transaction._id).slice(-8).toUpperCase()}`,
    title: clean(related.title, "MR Creativist payment bill"),
    buyerName,
    buyerEmail,
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
  const dark = rgb(0.05, 0.08, 0.12);
  const muted = rgb(0.34, 0.42, 0.52);
  const green = rgb(0.05, 0.52, 0.25);
  let y = 790;

  page.drawText("MR Creativist", { x: 48, y, size: 22, font: bold, color: dark });
  page.drawText(data.title, { x: 48, y: y - 28, size: 12, font: regular, color: muted });
  page.drawText(`Bill ${data.billNo}`, { x: 420, y, size: 14, font: bold, color: dark });
  page.drawText(invoiceDate(data.paidAt), { x: 420, y: y - 22, size: 10, font: regular, color: muted });
  y -= 82;

  page.drawRectangle({ x: 48, y: y - 84, width: 499, height: 84, color: rgb(0.96, 0.98, 0.97), borderColor: rgb(0.82, 0.88, 0.86), borderWidth: 1 });
  page.drawText("Bill To", { x: 68, y: y - 24, size: 11, font: bold, color: muted });
  page.drawText(data.buyerName, { x: 68, y: y - 45, size: 14, font: bold, color: dark });
  page.drawText(data.buyerEmail, { x: 68, y: y - 64, size: 10, font: regular, color: muted });
  page.drawText("Status", { x: 370, y: y - 24, size: 11, font: bold, color: muted });
  page.drawText(data.status.toUpperCase(), { x: 370, y: y - 45, size: 13, font: bold, color: green });
  page.drawText(data.paymentMethod, { x: 370, y: y - 64, size: 10, font: regular, color: muted });
  y -= 124;

  page.drawText("Item", { x: 48, y, size: 11, font: bold, color: muted });
  page.drawText("Qty", { x: 386, y, size: 11, font: bold, color: muted });
  page.drawText("Amount", { x: 470, y, size: 11, font: bold, color: muted });
  y -= 18;
  page.drawLine({ start: { x: 48, y }, end: { x: 547, y }, thickness: 1, color: rgb(0.84, 0.88, 0.93) });
  y -= 28;

  for (const item of data.items.slice(0, 12)) {
    page.drawText(item.name.slice(0, 54), { x: 48, y, size: 11, font: regular, color: dark });
    page.drawText(String(item.quantity), { x: 390, y, size: 11, font: regular, color: dark });
    page.drawText(money(item.amount, data.currency), { x: 452, y, size: 11, font: regular, color: dark });
    y -= 26;
  }

  y -= 18;
  page.drawLine({ start: { x: 340, y }, end: { x: 547, y }, thickness: 1, color: rgb(0.84, 0.88, 0.93) });
  y -= 30;
  page.drawText("Total", { x: 370, y, size: 14, font: bold, color: dark });
  page.drawText(money(data.amount, data.currency), { x: 452, y, size: 14, font: bold, color: dark });
  y -= 52;

  page.drawText(`Reference: ${data.reference}`, { x: 48, y, size: 10, font: regular, color: muted });
  page.drawText("Thank you for choosing MR Creativist.", { x: 48, y: 54, size: 10, font: regular, color: muted });

  return Buffer.from(await pdf.save());
}

export async function sendPaymentBillEmail(transactionId: string) {
  const data = await getPaymentBillData(transactionId);
  if (!data.buyerEmail) return null;

  const pdf = await renderPaymentBillPdf(data);

  return sendEmail({
    to: data.buyerEmail,
    subject: `${data.title} ${data.billNo}`,
    text: `Hi ${data.buyerName}, your MR Creativist bill ${data.billNo} is attached. Total: ${money(data.amount, data.currency)}.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="margin:0 0 12px">${data.title}</h2>
        <p>Hi ${data.buyerName}, your bill <strong>${data.billNo}</strong> is attached.</p>
        <p>Total: <strong>${money(data.amount, data.currency)}</strong></p>
        <p>Reference: ${data.reference}</p>
      </div>
    `,
    attachments: [
      {
        filename: `${data.billNo}.pdf`,
        content: pdf,
        contentType: "application/pdf"
      }
    ]
  });
}

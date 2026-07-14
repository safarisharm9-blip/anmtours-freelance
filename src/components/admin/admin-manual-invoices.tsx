"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Download,
  FileText,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type ManualInvoiceView = {
  id: string;
  invoiceNumber: string;
  status: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerAddress: string | null;
  travelDate: Date | string | null;
  items: InvoiceItem[];
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  notes: string | null;
  paidAt: Date | string | null;
  emailSentAt: Date | string | null;
  emailError: string | null;
  createdAt: Date | string;
};

type EditableItem = Omit<InvoiceItem, "lineTotal">;

type InvoiceForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  travelDate: string;
  items: EditableItem[];
  currency: string;
  discountAmount: number;
  taxRate: number;
  amountPaid: number;
  status: string;
  paymentMethod: string;
  notes: string;
};

const EMPTY_FORM: InvoiceForm = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerAddress: "",
  travelDate: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  currency: "USD",
  discountAmount: 0,
  taxRate: 0,
  amountPaid: 0,
  status: "UNPAID",
  paymentMethod: "CASH",
  notes: "",
};

const STATUS_OPTIONS = [
  "DRAFT",
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
  "REFUNDED",
] as const;

export function AdminManualInvoices({ invoices }: { invoices: ManualInvoiceView[] }) {
  const t = useTranslations("AdminInvoices");
  const locale = useLocale();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    const term = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;
      const matchesQuery = !term || [
        invoice.invoiceNumber,
        invoice.customerName,
        invoice.customerEmail,
      ].some((value) => value.toLowerCase().includes(term));
      return matchesStatus && matchesQuery;
    });
  }, [invoices, query, statusFilter]);

  const totals = useMemo(() => calculateFormTotals(form), [form]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, items: [{ description: "", quantity: 1, unitPrice: 0 }] });
    setDialogOpen(true);
  };

  const openEdit = (invoice: ManualInvoiceView) => {
    setEditingId(invoice.id);
    setForm({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone ?? "",
      customerAddress: invoice.customerAddress ?? "",
      travelDate: invoice.travelDate ? toDateInput(invoice.travelDate) : "",
      items: invoice.items.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
      currency: invoice.currency,
      discountAmount: invoice.discountAmount,
      taxRate: invoice.taxRate,
      amountPaid: invoice.amountPaid,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes ?? "",
    });
    setDialogOpen(true);
  };

  const updateItem = (index: number, changes: Partial<EditableItem>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item),
    }));
  };

  const removeItem = (index: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const amountPaid = form.status === "PAID"
        ? totals.total
        : form.status === "UNPAID" || form.status === "DRAFT"
          ? 0
          : form.amountPaid;
      const response = await fetch(
        editingId ? `/api/admin/invoices/${editingId}` : "/api/admin/invoices",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, amountPaid }),
        }
      );
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Failed to save invoice.");

      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t("errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async (invoice: ManualInvoiceView) => {
    setActionId(`send-${invoice.id}`);
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}/send`, { method: "POST" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Failed to send invoice.");
      alert(t("messages.sent", { email: invoice.customerEmail }));
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t("errors.send"));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (invoice: ManualInvoiceView) => {
    if (!confirm(t("messages.deleteConfirm", { invoiceNumber: invoice.invoiceNumber }))) return;
    setActionId(`delete-${invoice.id}`);
    try {
      const response = await fetch(`/api/admin/invoices/${invoice.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "Failed to delete invoice.");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : t("errors.delete"));
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <FileText className="size-5" />
            {t("manualInvoices", { count: invoices.length })}
          </CardTitle>
          <Button type="button" className="w-full sm:w-auto" onClick={openCreate}>
            <Plus className="size-4" />
            {t("createInvoice")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:p-5 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchInvoices")}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("statuses.ALL")}</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>{t(`statuses.${status}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">{t("noInvoicesFound")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left">{t("invoice")}</th>
                  <th className="px-4 py-3 text-left">{t("customer")}</th>
                  <th className="px-4 py-3 text-left">{t("created")}</th>
                  <th className="px-4 py-3 text-left">{t("status")}</th>
                  <th className="px-4 py-3 text-right">{t("total")}</th>
                  <th className="px-4 py-3 text-left">{t("email")}</th>
                  <th className="px-4 py-3 text-right">{t("actionsLabel")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{invoice.customerName}</span>
                      <span className="block text-xs text-muted-foreground">{invoice.customerEmail}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.createdAt, locale)}</td>
                    <td className="px-4 py-3"><StatusBadge status={invoice.status} label={t(`statuses.${invoice.status}`)} /></td>
                    <td className="px-4 py-3 text-right font-medium">{formatMoney(invoice.total, invoice.currency, locale)}</td>
                    <td className="px-4 py-3 text-xs">
                      {invoice.emailSentAt ? (
                        <span className="text-emerald-700">{t("emailStates.sent", { date: formatDate(invoice.emailSentAt, locale) })}</span>
                      ) : invoice.emailError ? (
                        <span className="text-destructive" title={invoice.emailError}>{t("emailStates.failed")}</span>
                      ) : (
                        <span className="text-muted-foreground">{t("emailStates.notSent")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button type="button" size="icon-sm" variant="ghost" onClick={() => openEdit(invoice)} title={t("actions.editInvoice")}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button type="button" size="icon-sm" variant="ghost" asChild title={t("actions.downloadPdf")}>
                          <a href={`/api/admin/invoices/${invoice.id}/pdf`}>
                            <Download className="size-4" />
                          </a>
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleSend(invoice)}
                          disabled={actionId === `send-${invoice.id}`}
                          title={invoice.emailSentAt ? t("actions.sendInvoiceAgain") : t("actions.sendInvoice")}
                        >
                          <Mail className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleDelete(invoice)}
                          disabled={actionId === `delete-${invoice.id}`}
                          title={t("actions.deleteInvoice")}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => !saving && setDialogOpen(open)}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] gap-3 overflow-y-auto p-4 sm:max-h-[92vh] sm:w-full sm:gap-4 sm:max-w-4xl sm:p-6">
          <DialogHeader>
            <DialogTitle className="pr-8 text-base sm:text-lg">{editingId ? t("editInvoice") : t("createInvoice")}</DialogTitle>
            <DialogDescription className="sr-only">{t("description")}</DialogDescription>
          </DialogHeader>

          <form id="manual-invoice-form" onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">{t("customer")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("fields.name")} required>
                  <Input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
                </Field>
                <Field label={t("email")} required>
                  <Input required type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} />
                </Field>
                <Field label={t("fields.phone")}>
                  <Input type="tel" value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} />
                </Field>
                <Field label={t("fields.travelDate")}>
                  <Input type="date" value={form.travelDate} onChange={(event) => setForm({ ...form, travelDate: event.target.value })} />
                </Field>
              </div>
              <Field label={t("fields.address")}>
                <Textarea rows={2} value={form.customerAddress} onChange={(event) => setForm({ ...form, customerAddress: event.target.value })} />
              </Field>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{t("lineItems")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((current) => ({ ...current, items: [...current.items, { description: "", quantity: 1, unitPrice: 0 }] }))}
                  disabled={form.items.length >= 30}
                >
                  <Plus className="size-4" />
                  {t("addItem")}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="hidden grid-cols-[minmax(0,1fr)_minmax(70px,90px)_minmax(100px,130px)_minmax(80px,110px)_36px] gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid">
                    <span>{t("fields.description")}</span><span>{t("fields.quantity")}</span><span>{t("fields.unitPrice")}</span><span className="text-right">{t("fields.amount")}</span><span />
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(70px,90px)_minmax(100px,130px)_minmax(80px,110px)_36px] sm:items-center sm:gap-2 sm:rounded-none sm:border-0 sm:p-0">
                    <div className="space-y-1 sm:space-y-0">
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">{t("fields.description")}</span>
                      <Input required value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
                    </div>
                    <div className="space-y-1 sm:space-y-0">
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">{t("fields.quantity")}</span>
                      <Input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, { quantity: numberValue(event.target.value) })} />
                    </div>
                    <div className="space-y-1 sm:space-y-0">
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">{t("fields.unitPrice")}</span>
                      <Input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: numberValue(event.target.value) })} />
                    </div>
                    <div className="flex items-center justify-between sm:block">
                      <span className="text-xs font-medium text-muted-foreground sm:hidden">{t("fields.amount")}</span>
                      <span className="text-right text-sm font-medium">{formatMoney(item.quantity * item.unitPrice, form.currency, locale)}</span>
                    </div>
                    <Button type="button" size="icon-sm" variant="ghost" className="justify-self-end sm:justify-self-auto" onClick={() => removeItem(index)} disabled={form.items.length === 1} title={t("actions.removeItem")}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 border-t pt-5 md:grid-cols-2">
              <div className="grid content-start gap-4 sm:grid-cols-2">
                <Field label={t("fields.currency")}>
                  <Select value={form.currency} onValueChange={(currency) => setForm({ ...form, currency })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="EGP">EGP</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("fields.paymentMethod")}>
                  <Select value={form.paymentMethod} onValueChange={(paymentMethod) => setForm({ ...form, paymentMethod })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">{t("paymentMethods.CASH")}</SelectItem>
                      <SelectItem value="BANK_TRANSFER">{t("paymentMethods.BANK_TRANSFER")}</SelectItem>
                      <SelectItem value="CARD">{t("paymentMethods.CARD")}</SelectItem>
                      <SelectItem value="OTHER">{t("paymentMethods.OTHER")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("status")}>
                  <Select value={form.status} onValueChange={(status) => setForm({ ...form, status })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{t(`statuses.${status}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("fields.amountPaid")}>
                  <Input
                    type="number"
                    min="0"
                    max={totals.total}
                    step="0.01"
                    value={form.status === "PAID" ? totals.total : form.amountPaid}
                    disabled={form.status === "PAID" || form.status === "UNPAID" || form.status === "DRAFT"}
                    onChange={(event) => setForm({ ...form, amountPaid: numberValue(event.target.value) })}
                  />
                </Field>
                <Field label={t("fields.discount")}>
                  <Input type="number" min="0" step="0.01" value={form.discountAmount} onChange={(event) => setForm({ ...form, discountAmount: numberValue(event.target.value) })} />
                </Field>
                <Field label={t("fields.taxRate")}>
                  <Input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: numberValue(event.target.value) })} />
                </Field>
              </div>

              <div className="space-y-3 border-t pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                <SummaryRow label={t("summary.subtotal")} value={formatMoney(totals.subtotal, form.currency, locale)} />
                <SummaryRow label={t("summary.discount")} value={`-${formatMoney(totals.discount, form.currency, locale)}`} />
                <SummaryRow label={t("summary.tax", { rate: form.taxRate || 0 })} value={formatMoney(totals.tax, form.currency, locale)} />
                <div className="border-t pt-3"><SummaryRow label={t("summary.total")} value={formatMoney(totals.total, form.currency, locale)} strong /></div>
                <SummaryRow label={t("summary.balanceDue")} value={formatMoney(getFormBalanceDue(form, totals.total), form.currency, locale)} strong />
              </div>
            </section>

            <Field label={t("fields.notes")}>
              <Textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
          </form>

          <DialogFooter className="pt-1 sm:pt-0">
            <Button type="button" className="w-full sm:w-auto" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>{t("cancel")}</Button>
            <Button type="submit" className="w-full sm:w-auto" form="manual-invoice-form" disabled={saving}>
              <FileText className="size-4" />
              {saving ? t("saving") : editingId ? t("saveChanges") : t("createInvoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? " *" : ""}</Label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "font-semibold" : "text-sm"}`}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const color = status === "PAID"
    ? "bg-emerald-500/10 text-emerald-700"
    : status === "PARTIALLY_PAID"
      ? "bg-sky-500/10 text-sky-700"
      : status === "UNPAID"
        ? "bg-amber-500/10 text-amber-700"
        : status === "CANCELLED" || status === "REFUNDED"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground";
  return <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${color}`}>{label}</span>;
}

function calculateFormTotals(form: InvoiceForm) {
  const subtotal = roundMoney(form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
  const discount = Math.min(roundMoney(form.discountAmount), subtotal);
  const tax = roundMoney(Math.max(0, subtotal - discount) * (form.taxRate / 100));
  return { subtotal, discount, tax, total: roundMoney(subtotal - discount + tax) };
}

function getFormBalanceDue(form: InvoiceForm, total: number) {
  if (form.status === "CANCELLED" || form.status === "REFUNDED" || form.status === "PAID") {
    return 0;
  }
  return Math.max(0, total - form.amountPaid);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function numberValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

function formatDate(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

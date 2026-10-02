-- Payment gateway pindah dari Xendit ke Midtrans: kolom referensi dibuat netral.
ALTER TABLE "transactions" RENAME COLUMN "xendit_invoice_id" TO "payment_ref";
ALTER INDEX "transactions_xendit_invoice_id_key" RENAME TO "transactions_payment_ref_key";

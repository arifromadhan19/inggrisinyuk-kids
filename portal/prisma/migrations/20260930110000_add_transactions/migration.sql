-- Pembelian akses selamanya lewat Xendit Invoice (halaman /daftar app anak).
CREATE TABLE "transactions" (
    "order_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "child_name" TEXT NOT NULL,
    "parent_id" TEXT,
    "xendit_invoice_id" TEXT,
    "payment_method" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 99000,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "token_claimed_at" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("order_id")
);

CREATE UNIQUE INDEX "transactions_xendit_invoice_id_key" ON "transactions"("xendit_invoice_id");
CREATE INDEX "transactions_phone_idx" ON "transactions"("phone");

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

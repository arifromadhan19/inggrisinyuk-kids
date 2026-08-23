-- CreateTable
CREATE TABLE "child_progress" (
    "id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "child_progress_child_id_key" ON "child_progress"("child_id");

-- AddForeignKey
ALTER TABLE "child_progress" ADD CONSTRAINT "child_progress_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

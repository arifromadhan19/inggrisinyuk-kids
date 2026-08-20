-- Reconcile migration history with live DB: password_hash was dropped from
-- parent_accounts during the passwordless-login pivot (RESEARCH.md SS16) via a
-- direct schema push, without ever recording a migration for it. This file
-- makes history match reality; it is marked --applied (not executed) since
-- the live DB already lacks the column.
ALTER TABLE "parent_accounts" DROP COLUMN "password_hash";

-- SellerNotification 테이블 생성
-- 적용: psql $DATABASE_URL -f prisma/migrations/manual/add_seller_notifications.sql
-- 이후: npx prisma generate (Prisma Client 타입 재생성)

CREATE TABLE IF NOT EXISTS "seller_notifications" (
    "id"           TEXT          NOT NULL,
    "supplier_id"  TEXT          NOT NULL,
    "order_id"     TEXT          NOT NULL,
    "type"         VARCHAR(50)   NOT NULL DEFAULT 'NEW_ORDER',
    "title"        VARCHAR(200)  NOT NULL,
    "body"         TEXT          NOT NULL,
    "items_json"   JSONB,
    "amount_usd"   DECIMAL(10,2) NOT NULL,
    "is_read"      BOOLEAN       NOT NULL DEFAULT false,
    "email_sent"   BOOLEAN       NOT NULL DEFAULT false,
    "created_at"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "seller_notifications_supplier_id_idx"
    ON "seller_notifications"("supplier_id");

CREATE INDEX IF NOT EXISTS "seller_notifications_order_id_idx"
    ON "seller_notifications"("order_id");

CREATE UNIQUE INDEX IF NOT EXISTS "seller_notifications_order_id_supplier_id_type_key"
    ON "seller_notifications"("order_id", "supplier_id", "type");

ALTER TABLE "seller_notifications"
    ADD CONSTRAINT "seller_notifications_supplier_id_fkey"
    FOREIGN KEY ("supplier_id")
    REFERENCES "suppliers"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

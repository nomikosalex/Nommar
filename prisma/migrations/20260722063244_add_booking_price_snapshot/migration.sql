-- Freeze a complete, immutable price record on each Booking at creation time.
-- Rename the cross-sell discount column (self-documenting) and add the frozen
-- promo % + final charged amount. RENAME (not DROP/ADD) preserves existing values.

-- Rename discountPct -> crossSellPct (the 2nd+ à-la-carte −10%)
ALTER TABLE "Booking" RENAME COLUMN "discountPct" TO "crossSellPct";

-- Promo % actually applied, frozen at creation (never read from PROMO.pct later)
ALTER TABLE "Booking" ADD COLUMN "promoPct" INTEGER NOT NULL DEFAULT 0;

-- Amount charged after both discounts stack multiplicatively; null if priceCents null
ALTER TABLE "Booking" ADD COLUMN "finalPriceCents" INTEGER;

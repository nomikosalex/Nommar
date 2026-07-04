-- Rooms have multiple beds: capacity = how many treatments can run at once.
ALTER TABLE "Room" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 1;

-- The two existing suites each have 2 beds.
UPDATE "Room" SET "capacity" = 2;

-- Massage can be performed in both rooms; it was missing from Suite One.
-- Head Spa stays Suite One only (but now on both of its beds).
UPDATE "Room"
SET "categories" = 'Head Spa,Massage,Facial Treatments,Body Treatments'
WHERE "name" = 'Suite One';

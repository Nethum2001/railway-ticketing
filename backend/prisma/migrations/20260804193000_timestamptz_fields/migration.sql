-- Convert naive timestamp columns to timezone-aware timestamptz.
-- Existing values are interpreted as UTC to preserve stored instants.

ALTER TABLE "User"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Train"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "TrainStop"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Station"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Coach"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Fare"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Seat"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Booking"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "cancelledAt" TYPE TIMESTAMPTZ(3)
  USING CASE
    WHEN "cancelledAt" IS NULL THEN NULL
    ELSE "cancelledAt" AT TIME ZONE 'UTC'
  END;

ALTER TABLE "IdempotencyKey"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

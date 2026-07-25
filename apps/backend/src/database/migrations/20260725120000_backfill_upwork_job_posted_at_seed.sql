-- Backfill posted_at / posted_time from Apify raw_payload when columns were left null.

UPDATE "upwork_jobs"
SET
  "posted_at" = COALESCE(
    "posted_at",
    NULLIF(BTRIM(COALESCE("raw_payload"->>'absoluteDate', "raw_payload"->>'absolute_date', '')), '')::timestamptz
  ),
  "posted_time" = COALESCE(
    NULLIF(BTRIM(COALESCE("posted_time", '')), ''),
    NULLIF(BTRIM(COALESCE(
      "raw_payload"->>'relativeDate',
      "raw_payload"->>'postedTime',
      "raw_payload"->>'posted_time',
      ''
    )), '')
  )
WHERE "raw_payload" IS NOT NULL
  AND (
    "posted_at" IS NULL
    OR "posted_time" IS NULL
    OR BTRIM(COALESCE("posted_time", '')) = ''
  );

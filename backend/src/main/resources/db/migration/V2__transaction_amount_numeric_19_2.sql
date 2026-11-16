DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM transactions
        WHERE amount IS NULL
           OR amount::text IN ('NaN', 'Infinity', '-Infinity')
           OR amount <= 0
           OR abs(amount::numeric) > 99999999999999999.99
           OR amount::numeric <> trunc(amount::numeric, 2)
    ) THEN
        RAISE EXCEPTION 'Cannot convert transactions.amount to NUMERIC(19,2): invalid, nonpositive, out-of-range, or over-precision data exists';
    END IF;
END $$;

ALTER TABLE transactions
    ALTER COLUMN amount TYPE numeric(19,2)
    USING amount::numeric(19,2);

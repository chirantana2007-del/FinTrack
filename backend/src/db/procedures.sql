-- FinTrack stored routines
-- Run after schema.sql.
--
-- Contains:
--   fn_categorize_transaction(description)  -- matches a description against global
--                                            -- CategoryRules and returns a category_id
--   sp_generate_monthly_summary(user_id, month) -- full recompute of MonthlySummary for
--                                            -- one user/month (idempotent: safe to
--                                            -- re-run, e.g. after a backfill or a
--                                            -- correction to historical transactions)

DROP FUNCTION IF EXISTS fn_categorize_transaction;
DROP PROCEDURE IF EXISTS sp_generate_monthly_summary;

DELIMITER $$

CREATE FUNCTION fn_categorize_transaction(p_description VARCHAR(255))
RETURNS INT UNSIGNED
READS SQL DATA
NOT DETERMINISTIC
BEGIN
    DECLARE v_category_id INT UNSIGNED DEFAULT NULL;
    DECLARE v_normalized VARCHAR(255);

    SET v_normalized = LOWER(TRIM(p_description));

    SELECT category_id INTO v_category_id
    FROM CategoryRules
    WHERE is_active = 1
      AND user_id IS NULL
      AND (
            (match_type = 'contains'    AND v_normalized LIKE CONCAT('%', LOWER(pattern), '%'))
         OR (match_type = 'starts_with' AND v_normalized LIKE CONCAT(LOWER(pattern), '%'))
         OR (match_type = 'exact'       AND v_normalized = LOWER(pattern))
         OR (match_type = 'regex'       AND v_normalized REGEXP pattern)
      )
    ORDER BY priority ASC
    LIMIT 1;

    RETURN v_category_id;
END$$

CREATE PROCEDURE sp_generate_monthly_summary(
    IN p_user_id INT UNSIGNED,
    IN p_month DATE
)
proc_body: BEGIN
    DECLARE v_period_start DATE;
    DECLARE v_period_end DATE;

    SET v_period_start = DATE_FORMAT(p_month, '%Y-%m-01');
    SET v_period_end = DATE_ADD(v_period_start, INTERVAL 1 MONTH);

    START TRANSACTION;

    -- Recompute from scratch for this user/month so the procedure is safely
    -- re-runnable (backfills, corrected transactions, etc).
    DELETE FROM MonthlySummary
    WHERE user_id = p_user_id
      AND period_month = v_period_start;

    INSERT INTO MonthlySummary
        (user_id, category_id, period_month, total_income, total_expense, net_amount)
    SELECT
        p_user_id,
        t.category_id,
        v_period_start,
        SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END)   AS total_income,
        SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END)  AS total_expense,
        SUM(t.amount)                                          AS net_amount
    FROM Transactions t
    INNER JOIN Accounts a ON a.account_id = t.account_id
    WHERE a.user_id = p_user_id
      AND t.transaction_date >= v_period_start
      AND t.transaction_date < v_period_end
    GROUP BY t.category_id;

    COMMIT;
END$$

DELIMITER ;

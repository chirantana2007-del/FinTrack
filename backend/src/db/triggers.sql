-- FinTrack triggers
-- Run after schema.sql and procedures.sql.
--
-- trg_after_transaction_insert:
--   1. Incrementally maintains the MonthlySummary row for the affected
--      user/category/month (the other write path is sp_generate_monthly_summary,
--      which does a full recompute — application code must never write
--      MonthlySummary directly).
--   2. On an expense transaction, checks the running spend for that
--      category/month against the user's Budgets limit. When spend crosses the
--      user's configured notify_budget_threshold_pct (UserSettings), inserts a
--      single Notifications row for that crossing (guarded so it doesn't fire
--      again on every subsequent transaction in the same category/month).

DROP TRIGGER IF EXISTS trg_after_transaction_insert;

DELIMITER $$

CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON Transactions
FOR EACH ROW
trig_body: BEGIN
    DECLARE v_user_id INT UNSIGNED;
    DECLARE v_period_start DATE;
    DECLARE v_summary_id INT UNSIGNED DEFAULT NULL;
    DECLARE v_budget_limit DECIMAL(12,2) DEFAULT NULL;
    DECLARE v_spent DECIMAL(14,2) DEFAULT NULL;
    DECLARE v_prior_spent DECIMAL(14,2) DEFAULT NULL;
    DECLARE v_expense_delta DECIMAL(14,2) DEFAULT 0;
    DECLARE v_threshold_pct DECIMAL(5,2) DEFAULT 80.00;
    DECLARE v_threshold_amount DECIMAL(14,2) DEFAULT NULL;

    SELECT user_id INTO v_user_id FROM Accounts WHERE account_id = NEW.account_id;
    SET v_period_start = DATE_FORMAT(NEW.transaction_date, '%Y-%m-01');

    -- 1. Incremental MonthlySummary maintenance.
    -- category_id is nullable (uncategorized transactions), and MySQL unique
    -- indexes never treat two NULLs as a match, so ON DUPLICATE KEY UPDATE
    -- can't be trusted here — look the row up explicitly with a NULL-safe
    -- comparison (<=>) instead.
    SELECT summary_id INTO v_summary_id
    FROM MonthlySummary
    WHERE user_id = v_user_id
      AND period_month = v_period_start
      AND category_id <=> NEW.category_id
    LIMIT 1;

    IF v_summary_id IS NULL THEN
        INSERT INTO MonthlySummary
            (user_id, category_id, period_month, total_income, total_expense, net_amount)
        VALUES (
            v_user_id,
            NEW.category_id,
            v_period_start,
            IF(NEW.amount > 0, NEW.amount, 0),
            IF(NEW.amount < 0, -NEW.amount, 0),
            NEW.amount
        );
    ELSE
        UPDATE MonthlySummary
        SET total_income  = total_income  + IF(NEW.amount > 0, NEW.amount, 0),
            total_expense = total_expense + IF(NEW.amount < 0, -NEW.amount, 0),
            net_amount    = net_amount + NEW.amount
        WHERE summary_id = v_summary_id;
    END IF;

    -- 2. Budget threshold check — expenses with a category only.
    IF NEW.amount >= 0 OR NEW.category_id IS NULL THEN
        LEAVE trig_body;
    END IF;

    SELECT limit_amount INTO v_budget_limit
    FROM Budgets
    WHERE user_id = v_user_id
      AND category_id = NEW.category_id
      AND period_month = v_period_start
    LIMIT 1;

    IF v_budget_limit IS NULL THEN
        LEAVE trig_body;
    END IF;

    SELECT total_expense INTO v_spent
    FROM MonthlySummary
    WHERE user_id = v_user_id
      AND category_id = NEW.category_id
      AND period_month = v_period_start
    LIMIT 1;

    SELECT COALESCE(notify_budget_threshold_pct, 80.00) INTO v_threshold_pct
    FROM UserSettings
    WHERE user_id = v_user_id;

    SET v_threshold_pct = COALESCE(v_threshold_pct, 80.00);
    SET v_threshold_amount = v_budget_limit * (v_threshold_pct / 100);
    SET v_expense_delta = -NEW.amount;
    SET v_prior_spent = v_spent - v_expense_delta;

    -- Two independent crossing checks, each guarded so it fires exactly once
    -- (on the transaction that causes the crossing), not on every transaction
    -- afterwards:
    --   1. the user's configurable early-warning threshold (UserSettings)
    --   2. going over budget (100% of the limit) — checked independently so it
    --      still fires even if the warning threshold was crossed on an earlier
    --      transaction in the same category/month
    IF v_prior_spent < v_threshold_amount AND v_spent >= v_threshold_amount THEN
        INSERT INTO Notifications (user_id, type, message, related_entity_type, related_entity_id)
        VALUES (
            v_user_id,
            'budget_alert',
            CONCAT(
                'Budget threshold reached for category ', NEW.category_id, ': ',
                ROUND((v_spent / v_budget_limit) * 100, 1), '% of limit used.'
            ),
            'Budget',
            NEW.category_id
        );
    END IF;

    IF v_prior_spent < v_budget_limit AND v_spent >= v_budget_limit THEN
        INSERT INTO Notifications (user_id, type, message, related_entity_type, related_entity_id)
        VALUES (
            v_user_id,
            'budget_alert',
            CONCAT(
                'Budget exceeded for category ', NEW.category_id, ': ',
                ROUND((v_spent / v_budget_limit) * 100, 1), '% of limit used.'
            ),
            'Budget',
            NEW.category_id
        );
    END IF;
END$$

DELIMITER ;

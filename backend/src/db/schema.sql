-- FinTrack database schema
-- 15 tables: Currencies, Users, UserSettings, Accounts, Categories, CategoryRules,
-- Merchants, Transactions, Budgets, Goals, Subscriptions, MonthlySummary,
-- Notifications, UploadedFiles, AuditLog
--
-- Sign convention (Transactions.amount): NEGATIVE = debit / money out (expense),
-- POSITIVE = credit / money in (income). All spend aggregations therefore filter
-- amount < 0 and SUM/ABS as needed; income aggregations filter amount > 0.
--
-- MonthlySummary is a derived/materialized table. It must only ever be written by
-- DB-side objects: sp_generate_monthly_summary (full recompute, see procedures.sql)
-- and trg_after_transaction_insert (incremental maintenance, see triggers.sql) —
-- application code must not INSERT/UPDATE it directly.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS AuditLog;
DROP TABLE IF EXISTS Notifications;
DROP TABLE IF EXISTS MonthlySummary;
DROP TABLE IF EXISTS Subscriptions;
DROP TABLE IF EXISTS Goals;
DROP TABLE IF EXISTS Budgets;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS UploadedFiles;
DROP TABLE IF EXISTS Merchants;
DROP TABLE IF EXISTS CategoryRules;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Accounts;
DROP TABLE IF EXISTS UserSettings;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Currencies;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- 1. Currencies
-- ---------------------------------------------------------------------------
CREATE TABLE Currencies (
    currency_code   CHAR(3)      NOT NULL,
    name            VARCHAR(50)  NOT NULL,
    symbol          VARCHAR(5)   NOT NULL,
    PRIMARY KEY (currency_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 2. Users
-- ---------------------------------------------------------------------------
CREATE TABLE Users (
    user_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('user','admin') NOT NULL DEFAULT 'user',
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 3. UserSettings  (1:1 with Users)
-- ---------------------------------------------------------------------------
CREATE TABLE UserSettings (
    user_id                       INT UNSIGNED NOT NULL,
    default_currency_code         CHAR(3)      NOT NULL DEFAULT 'INR',
    monthly_income                DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    notify_budget_threshold_pct   DECIMAL(5,2) NOT NULL DEFAULT 80.00,
    timezone                      VARCHAR(50)  NOT NULL DEFAULT 'Asia/Kolkata',
    created_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_usersettings_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_usersettings_currency
        FOREIGN KEY (default_currency_code) REFERENCES Currencies(currency_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 4. Accounts
-- ---------------------------------------------------------------------------
CREATE TABLE Accounts (
    account_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    account_name    VARCHAR(100) NOT NULL,
    account_type    ENUM('bank','credit_card','cash','wallet','investment') NOT NULL,
    currency_code   CHAR(3)      NOT NULL DEFAULT 'INR',
    opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id),
    CONSTRAINT fk_accounts_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_accounts_currency
        FOREIGN KEY (currency_code) REFERENCES Currencies(currency_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 5. Categories  (self-referencing for sub-categories; user_id NULL = system default)
-- ---------------------------------------------------------------------------
CREATE TABLE Categories (
    category_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED NULL,
    parent_category_id  INT UNSIGNED NULL,
    name                VARCHAR(100) NOT NULL,
    type                ENUM('income','expense') NOT NULL DEFAULT 'expense',
    icon                VARCHAR(50)  NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_categories_parent
        FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id)
        ON DELETE SET NULL,
    UNIQUE KEY uq_categories_scope_name (user_id, parent_category_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 6. CategoryRules  (drives auto-categorization; NULL user_id = global rule)
-- ---------------------------------------------------------------------------
CREATE TABLE CategoryRules (
    rule_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    category_id   INT UNSIGNED NOT NULL,
    user_id       INT UNSIGNED NULL,
    match_type    ENUM('contains','starts_with','regex','exact') NOT NULL DEFAULT 'contains',
    pattern       VARCHAR(255) NOT NULL,
    priority      INT UNSIGNED NOT NULL DEFAULT 100,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rule_id),
    CONSTRAINT fk_categoryrules_category
        FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE,
    CONSTRAINT fk_categoryrules_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    KEY idx_categoryrules_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 7. Merchants
-- ---------------------------------------------------------------------------
CREATE TABLE Merchants (
    merchant_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    canonical_name        VARCHAR(150) NOT NULL,
    default_category_id   INT UNSIGNED NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (merchant_id),
    UNIQUE KEY uq_merchants_canonical_name (canonical_name),
    CONSTRAINT fk_merchants_default_category
        FOREIGN KEY (default_category_id) REFERENCES Categories(category_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 8. UploadedFiles
-- ---------------------------------------------------------------------------
CREATE TABLE UploadedFiles (
    file_id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED NOT NULL,
    account_id          INT UNSIGNED NULL,
    original_filename   VARCHAR(255) NOT NULL,
    status              ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
    total_rows          INT UNSIGNED NOT NULL DEFAULT 0,
    inserted_rows       INT UNSIGNED NOT NULL DEFAULT 0,
    failed_rows         INT UNSIGNED NOT NULL DEFAULT 0,
    error_log           TEXT NULL,
    uploaded_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at        TIMESTAMP    NULL,
    PRIMARY KEY (file_id),
    CONSTRAINT fk_uploadedfiles_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_uploadedfiles_account
        FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 9. Transactions
-- ---------------------------------------------------------------------------
CREATE TABLE Transactions (
    transaction_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id          INT UNSIGNED NOT NULL,
    merchant_id         INT UNSIGNED NULL,
    category_id         INT UNSIGNED NULL,
    uploaded_file_id    INT UNSIGNED NULL,
    transaction_date    DATE           NOT NULL,
    description         VARCHAR(255)   NOT NULL,
    raw_description     VARCHAR(255)   NULL,
    amount              DECIMAL(14,2)  NOT NULL,
    currency_code       CHAR(3)        NOT NULL DEFAULT 'INR',
    is_recurring        TINYINT(1)     NOT NULL DEFAULT 0,
    is_flagged_anomaly  TINYINT(1)     NOT NULL DEFAULT 0,
    needs_review        TINYINT(1)     NOT NULL DEFAULT 0,
    created_at          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (transaction_id),
    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id) REFERENCES Accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT fk_transactions_merchant
        FOREIGN KEY (merchant_id) REFERENCES Merchants(merchant_id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_category
        FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_uploaded_file
        FOREIGN KEY (uploaded_file_id) REFERENCES UploadedFiles(file_id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_currency
        FOREIGN KEY (currency_code) REFERENCES Currencies(currency_code),
    CONSTRAINT chk_transactions_amount_nonzero CHECK (amount <> 0),
    KEY idx_transactions_account_date (account_id, transaction_date),
    KEY idx_transactions_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 10. Budgets
-- ---------------------------------------------------------------------------
CREATE TABLE Budgets (
    budget_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    category_id     INT UNSIGNED NOT NULL,
    period_month    DATE          NOT NULL COMMENT 'first day of the budgeted month',
    limit_amount    DECIMAL(12,2) NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (budget_id),
    CONSTRAINT fk_budgets_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_budgets_category
        FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE,
    CONSTRAINT chk_budgets_limit_positive CHECK (limit_amount > 0),
    UNIQUE KEY uq_budgets_user_category_month (user_id, category_id, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 11. Goals
-- ---------------------------------------------------------------------------
CREATE TABLE Goals (
    goal_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    name            VARCHAR(150)  NOT NULL,
    target_amount   DECIMAL(14,2) NOT NULL,
    current_amount  DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    target_date     DATE          NULL,
    status          ENUM('active','completed','abandoned') NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (goal_id),
    CONSTRAINT fk_goals_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_goals_target_positive CHECK (target_amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 12. Subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE Subscriptions (
    subscription_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED NOT NULL,
    merchant_id         INT UNSIGNED NOT NULL,
    category_id         INT UNSIGNED NULL,
    amount              DECIMAL(12,2) NOT NULL,
    cadence             ENUM('weekly','monthly','yearly') NOT NULL DEFAULT 'monthly',
    last_charged_date   DATE          NOT NULL,
    next_due_date       DATE          NULL,
    is_active           TINYINT(1)    NOT NULL DEFAULT 1,
    created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (subscription_id),
    CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_merchant
        FOREIGN KEY (merchant_id) REFERENCES Merchants(merchant_id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_category
        FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 13. MonthlySummary  (write path: DB-side only — sp_generate_monthly_summary /
--     trg_after_transaction_insert. Never written to directly by application code.)
-- ---------------------------------------------------------------------------
CREATE TABLE MonthlySummary (
    summary_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,
    category_id     INT UNSIGNED NULL,
    period_month    DATE          NOT NULL COMMENT 'first day of the summarized month',
    total_income    DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    total_expense   DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    net_amount      DECIMAL(14,2) NOT NULL DEFAULT 0.00,
    generated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (summary_id),
    CONSTRAINT fk_monthlysummary_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_monthlysummary_category
        FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE,
    UNIQUE KEY uq_monthlysummary_user_category_month (user_id, category_id, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 14. Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE Notifications (
    notification_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id              INT UNSIGNED NOT NULL,
    type                 ENUM('budget_alert','subscription_due','anomaly','system') NOT NULL,
    message              VARCHAR(255) NOT NULL,
    related_entity_type  VARCHAR(50)  NULL,
    related_entity_id    INT UNSIGNED NULL,
    is_read              TINYINT(1)   NOT NULL DEFAULT 0,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    KEY idx_notifications_user_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- 15. AuditLog
-- ---------------------------------------------------------------------------
CREATE TABLE AuditLog (
    audit_id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id       INT UNSIGNED NULL,
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(50)  NULL,
    entity_id     INT UNSIGNED NULL,
    details       JSON         NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (audit_id),
    CONSTRAINT fk_auditlog_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

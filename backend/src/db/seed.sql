-- FinTrack seed data (Task 4, owner: Member 1)
-- Run after schema.sql, procedures.sql, triggers.sql.
--
-- Scope: Users, Categories, CategoryRules, Merchants (as assigned), plus the
-- minimal Currencies/UserSettings rows those tables require via FK. Does NOT
-- seed Accounts/Budgets/Transactions/Goals/Subscriptions — those are owned by
-- other tasks and should come from the app itself (or Task 5's
-- sample_statement.csv for Transactions).
--
-- Idempotent: safe to re-run on its own. It clears only the tables it seeds
-- before re-inserting. NOTE: because Users cascades (ON DELETE CASCADE) to
-- Accounts/Budgets/Goals/Subscriptions/Transactions/etc, re-running this
-- against a database that already has real app-created users/data will
-- delete that data too. In the normal bootstrap flow (schema.sql already
-- drops and recreates every table) this never comes up.
--
-- Demo login credentials (DEV/DEMO ONLY — do not reuse this pattern in
-- production seed data):
--   admin@fintrack.dev / Password123!  (role: admin)
--   demo@fintrack.dev  / Password123!  (role: user)

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM CategoryRules;
DELETE FROM Merchants;
DELETE FROM Categories;
DELETE FROM UserSettings;
DELETE FROM Users;
DELETE FROM Currencies;
ALTER TABLE CategoryRules AUTO_INCREMENT = 1;
ALTER TABLE Merchants AUTO_INCREMENT = 1;
ALTER TABLE Categories AUTO_INCREMENT = 1;
ALTER TABLE Users AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Currencies (FK prerequisite for Users/UserSettings)
-- ---------------------------------------------------------------------------
INSERT INTO Currencies (currency_code, name, symbol) VALUES
    ('INR', 'Indian Rupee', '₹'),
    ('USD', 'US Dollar', '$');

-- ---------------------------------------------------------------------------
-- Users  (bcrypt hash below is a real hash of "Password123!", cost factor 10)
-- ---------------------------------------------------------------------------
INSERT INTO Users (full_name, email, password_hash, role) VALUES
    ('Admin User', 'admin@fintrack.dev', '$2b$10$Qv5UAhZeH1x/tt7KpWbm8upKIQmDzVDIRS7VxuxQ0km3kMF7JcmZe', 'admin'),
    ('Demo User',  'demo@fintrack.dev',  '$2b$10$Qv5UAhZeH1x/tt7KpWbm8upKIQmDzVDIRS7VxuxQ0km3kMF7JcmZe', 'user');

SET @admin_id = (SELECT user_id FROM Users WHERE email = 'admin@fintrack.dev');
SET @demo_id  = (SELECT user_id FROM Users WHERE email = 'demo@fintrack.dev');

INSERT INTO UserSettings (user_id, default_currency_code, monthly_income, notify_budget_threshold_pct) VALUES
    (@admin_id, 'INR', 0.00, 80.00),
    (@demo_id,  'INR', 60000.00, 80.00);

-- ---------------------------------------------------------------------------
-- Categories (global defaults: user_id NULL). Two branches demonstrate the
-- self-referencing parent_category_id; the rest are flat top-level categories.
-- ---------------------------------------------------------------------------
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Food & Dining', 'expense');
SET @cat_food = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, @cat_food, 'Groceries', 'expense');
SET @cat_groceries = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, @cat_food, 'Restaurants', 'expense');
SET @cat_restaurants = LAST_INSERT_ID();

INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Transportation', 'expense');
SET @cat_transport = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, @cat_transport, 'Fuel', 'expense');
SET @cat_fuel = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, @cat_transport, 'Public Transit', 'expense');
SET @cat_transit = LAST_INSERT_ID();

INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Utilities', 'expense');
SET @cat_utilities = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Housing', 'expense');
SET @cat_housing = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Entertainment', 'expense');
SET @cat_entertainment = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Shopping', 'expense');
SET @cat_shopping = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Healthcare', 'expense');
SET @cat_healthcare = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Subscriptions', 'expense');
SET @cat_subscriptions = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Miscellaneous', 'expense');
SET @cat_misc = LAST_INSERT_ID();

INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Salary', 'income');
SET @cat_salary = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Freelance Income', 'income');
SET @cat_freelance = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Investment Income', 'income');
SET @cat_investment = LAST_INSERT_ID();
INSERT INTO Categories (user_id, parent_category_id, name, type) VALUES (NULL, NULL, 'Other Income', 'income');
SET @cat_other_income = LAST_INSERT_ID();

-- ---------------------------------------------------------------------------
-- CategoryRules (global: user_id NULL). Lower priority number = matched
-- first when more than one pattern matches the same description — e.g.
-- "AMAZON PRIME MEMBERSHIP" matches both 'amazon' and 'amazon prime'; the
-- more specific rule (priority 5) wins over the generic one (priority 20).
-- ---------------------------------------------------------------------------
INSERT INTO CategoryRules (category_id, user_id, match_type, pattern, priority) VALUES
    (@cat_restaurants,    NULL, 'contains', 'swiggy',        10),
    (@cat_restaurants,    NULL, 'contains', 'zomato',        10),
    (@cat_groceries,      NULL, 'contains', 'bigbasket',     10),
    (@cat_groceries,      NULL, 'contains', 'blinkit',       10),
    (@cat_groceries,      NULL, 'contains', 'zepto',         10),
    (@cat_transit,        NULL, 'contains', 'uber',          10),
    (@cat_transit,        NULL, 'contains', 'ola',           10),
    (@cat_fuel,           NULL, 'contains', 'indian oil',    10),
    (@cat_fuel,           NULL, 'contains', 'hpcl',          10),
    (@cat_subscriptions,  NULL, 'contains', 'netflix',       10),
    (@cat_subscriptions,  NULL, 'contains', 'spotify',       10),
    (@cat_subscriptions,  NULL, 'contains', 'amazon prime',  5),
    (@cat_shopping,       NULL, 'contains', 'amazon',        20),
    (@cat_shopping,       NULL, 'contains', 'flipkart',      20),
    (@cat_utilities,      NULL, 'contains', 'electricity',   10),
    (@cat_utilities,      NULL, 'contains', 'broadband',     10),
    (@cat_housing,        NULL, 'contains', 'rent',          30),
    (@cat_healthcare,     NULL, 'contains', 'hospital',      10),
    (@cat_healthcare,     NULL, 'contains', 'pharmacy',      10),
    (@cat_salary,         NULL, 'contains', 'salary',        10),
    (@cat_investment,     NULL, 'contains', 'interest',      10),
    (@cat_freelance,      NULL, 'contains', 'freelance',     10);

-- ---------------------------------------------------------------------------
-- Merchants (canonical names the merchant-resolution service will match
-- against, each with a sensible default category for new/unrated merchants).
-- ---------------------------------------------------------------------------
INSERT INTO Merchants (canonical_name, default_category_id) VALUES
    ('Swiggy',          @cat_restaurants),
    ('Zomato',          @cat_restaurants),
    ('BigBasket',       @cat_groceries),
    ('Blinkit',         @cat_groceries),
    ('Zepto',           @cat_groceries),
    ('Uber',            @cat_transit),
    ('Ola',             @cat_transit),
    ('Indian Oil',      @cat_fuel),
    ('Netflix',         @cat_subscriptions),
    ('Spotify',         @cat_subscriptions),
    ('Amazon',          @cat_shopping),
    ('Flipkart',        @cat_shopping),
    ('BESCOM',          @cat_utilities),
    ('Apollo Pharmacy', @cat_healthcare);

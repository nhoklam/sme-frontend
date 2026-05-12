-- SQL to create promotions table (PostgreSQL)
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(30) NOT NULL,
    discount_value DECIMAL(15, 2) NOT NULL,
    min_order_value DECIMAL(15, 2),
    max_discount_amount DECIMAL(15, 2),
    max_usage INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    applicable_product_id UUID,
    applicable_category_id UUID,
    buy_quantity INTEGER,
    get_quantity INTEGER,
    start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    end_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON promotions(is_active, start_date, end_date);

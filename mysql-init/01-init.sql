-- WealthForge Database Initialization Script
-- This script creates the database schema and initial data

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS wealthforge;
USE wealthforge;

-- Wealth Builders table
CREATE TABLE IF NOT EXISTS wealth_builders (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    risk_tolerance ENUM('conservative','moderate','aggressive') DEFAULT 'moderate',
    role ENUM('builder','administrator') DEFAULT 'builder',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Financial Instruments table
CREATE TABLE IF NOT EXISTS financial_instruments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    instrument_type ENUM('bonds','fixed_deposits','mutual_funds','etfs','other') NOT NULL,
    duration_months INT NOT NULL,
    annual_return DECIMAL(5,2) NOT NULL,
    risk_level ENUM('low','moderate','high') NOT NULL,
    min_amount DECIMAL(12,2) DEFAULT 1000.00,
    max_amount DECIMAL(12,2),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wealth Entries table
CREATE TABLE IF NOT EXISTS wealth_entries (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    builder_id CHAR(36) NOT NULL,
    instrument_id CHAR(36) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active','matured','cancelled') DEFAULT 'active',
    expected_return DECIMAL(12,2),
    maturity_date DATE,
    FOREIGN KEY (builder_id) REFERENCES wealth_builders(id) ON DELETE CASCADE,
    FOREIGN KEY (instrument_id) REFERENCES financial_instruments(id) ON DELETE CASCADE
);

-- Activity Logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    builder_id CHAR(36),
    email VARCHAR(255),
    endpoint VARCHAR(255) NOT NULL,
    http_method ENUM('GET','POST','PUT','DELETE') NOT NULL,
    status_code INT NOT NULL,
    error_message TEXT,
    request_duration_ms INT,
    response_size_bytes INT,
    user_agent TEXT,
    ip_address VARCHAR(45),
    correlation_id VARCHAR(255),
    request_body JSON,
    response_body JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (builder_id) REFERENCES wealth_builders(id) ON DELETE SET NULL
);

-- Security Audits table
CREATE TABLE IF NOT EXISTS security_audits (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    builder_id CHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (builder_id) REFERENCES wealth_builders(id) ON DELETE CASCADE
);

-- Performance Metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    endpoint VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    average_latency_ms DECIMAL(10,2) NOT NULL,
    error_rate DECIMAL(5,2) NOT NULL,
    throughput_rps DECIMAL(10,2) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default administrator user
INSERT INTO wealth_builders (id, first_name, last_name, email, password_hash, risk_tolerance, role) VALUES
('admin-uuid-1234', 'Admin', 'User', 'admin@wealthforge.com', '$2b$10$rQZ8K9vL8xY5wE3tR6sB7uJ2nM4pQ7vC1dF5gH8iK3lN6oP9rS2tU5wX8yZ', 'moderate', 'administrator')
ON DUPLICATE KEY UPDATE email=email;

-- Insert sample financial instruments
INSERT INTO financial_instruments (id, name, instrument_type, duration_months, annual_return, risk_level, min_amount, max_amount, description, is_active) VALUES
('instrument-uuid-1', 'Premium Fixed Deposit', 'fixed_deposits', 12, 7.50, 'low', 10000, 1000000, 'Secure fixed deposit with competitive interest rates', TRUE),
('instrument-uuid-2', 'Corporate Bond Portfolio', 'bonds', 24, 8.25, 'moderate', 5000, 500000, 'Diversified corporate bond portfolio', TRUE),
('instrument-uuid-3', 'Growth Equity Fund', 'mutual_funds', 36, 12.00, 'high', 1000, 1000000, 'Growth-oriented equity mutual fund', TRUE),
('instrument-uuid-4', 'Government Securities ETF', 'etfs', 18, 6.75, 'low', 2000, 200000, 'Low-risk government securities exchange-traded fund', TRUE),
('instrument-uuid-5', 'Real Estate Investment Trust', 'other', 60, 9.50, 'moderate', 25000, 500000, 'Real estate investment trust with steady returns', TRUE)
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample wealth entries for admin user
INSERT INTO wealth_entries (id, builder_id, instrument_id, amount, status, expected_return, maturity_date) VALUES
('wealth-uuid-1', 'admin-uuid-1234', 'instrument-uuid-1', 50000, 'active', 3750, DATE_ADD(NOW(), INTERVAL 12 MONTH)),
('wealth-uuid-2', 'admin-uuid-1234', 'instrument-uuid-2', 25000, 'active', 4125, DATE_ADD(NOW(), INTERVAL 24 MONTH)),
('wealth-uuid-3', 'admin-uuid-1234', 'instrument-uuid-3', 10000, 'active', 3600, DATE_ADD(NOW(), INTERVAL 36 MONTH))
ON DUPLICATE KEY UPDATE amount=amount;

-- Create indexes for better performance
CREATE INDEX idx_wealth_builders_email ON wealth_builders(email);
CREATE INDEX idx_wealth_entries_builder_id ON wealth_entries(builder_id);
CREATE INDEX idx_wealth_entries_instrument_id ON wealth_entries(instrument_id);
CREATE INDEX idx_wealth_entries_status ON wealth_entries(status);
CREATE INDEX idx_activity_logs_builder_id ON activity_logs(builder_id);
CREATE INDEX idx_activity_logs_endpoint ON activity_logs(endpoint);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_security_audits_builder_id ON security_audits(builder_id);
CREATE INDEX idx_security_audits_resource ON security_audits(resource_type, resource_id);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);

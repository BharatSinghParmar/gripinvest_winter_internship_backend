-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `risk_appetite` ENUM('low', 'moderate', 'high') NOT NULL DEFAULT 'moderate',
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investment_products` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `name` VARCHAR(255) NOT NULL,
    `investment_type` ENUM('bond', 'fd', 'mf', 'etf', 'other') NOT NULL,
    `tenure_months` INTEGER NOT NULL,
    `annual_yield` DECIMAL(5, 2) NOT NULL,
    `risk_level` ENUM('low', 'moderate', 'high') NOT NULL,
    `min_investment` DECIMAL(12, 2) NOT NULL DEFAULT 1000.00,
    `max_investment` DECIMAL(12, 2) NULL,
    `description` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `investment_products_risk_level_annual_yield_idx`(`risk_level`, `annual_yield`),
    INDEX `investment_products_investment_type_tenure_months_idx`(`investment_type`, `tenure_months`),
    INDEX `investment_products_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `investments` (
    `id` CHAR(36) NOT NULL DEFAULT (UUID()),
    `user_id` CHAR(36) NOT NULL,
    `product_id` CHAR(36) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `invested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('active', 'matured', 'cancelled') NOT NULL DEFAULT 'active',
    `expected_return` DECIMAL(12, 2) NULL,
    `maturity_date` DATETIME(3) NULL,

    INDEX `investments_user_id_status_idx`(`user_id`, `status`),
    INDEX `investments_invested_at_idx`(`invested_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(36) NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `http_method` ENUM('GET', 'POST', 'PUT', 'DELETE') NOT NULL,
    `status_code` INTEGER NOT NULL,
    `error_message` VARCHAR(191) NULL,
    `request_duration_ms` INTEGER NULL,
    `response_size_bytes` INTEGER NULL,
    `user_agent` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,
    `error_code` VARCHAR(50) NULL,
    `correlation_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transaction_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `transaction_logs_status_code_idx`(`status_code`),
    INDEX `transaction_logs_correlation_id_idx`(`correlation_id`),
    INDEX `transaction_logs_error_code_idx`(`error_code`),
    INDEX `transaction_logs_ip_address_idx`(`ip_address`),
    INDEX `transaction_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `is_revoked` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,

    INDEX `refresh_tokens_user_id_is_revoked_idx`(`user_id`, `is_revoked`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_otps` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `otp_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `consumed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `password_otps_email_expires_at_idx`(`email`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_trails` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` CHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(50) NOT NULL,
    `resource_id` VARCHAR(36) NULL,
    `details` JSON NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_trails_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `audit_trails_action_idx`(`action`),
    INDEX `audit_trails_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `audit_trails_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `investments` ADD CONSTRAINT `investments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `investments` ADD CONSTRAINT `investments_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `investment_products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transaction_logs` ADD CONSTRAINT `transaction_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

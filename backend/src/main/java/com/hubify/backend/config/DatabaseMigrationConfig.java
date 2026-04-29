package com.hubify.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseMigrationConfig {

    @Bean
    CommandLineRunner ensureUserPresenceColumn(JdbcTemplate jdbcTemplate) {
        return args -> {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20)");
            jdbcTemplate.execute("UPDATE users SET status = 'OFFLINE' WHERE status IS NULL");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN status SET DEFAULT 'OFFLINE'");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN status SET NOT NULL");
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT");
        };
    }
}
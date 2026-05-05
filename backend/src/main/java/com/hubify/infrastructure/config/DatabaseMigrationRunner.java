package com.hubify.infrastructure.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            System.out.println("Verificando schema do banco de dados...");
            // Força a alteração da coluna avatar_url para TEXT para suportar Base64
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT");
            System.out.println("Coluna avatar_url atualizada para TEXT com sucesso.");
        } catch (Exception e) {
            // Se falhar (ex: coluna já é TEXT ou tabela não existe ainda), apenas ignora ou loga
            System.out.println("Aviso na migração de schema: " + e.getMessage());
        }
    }
}

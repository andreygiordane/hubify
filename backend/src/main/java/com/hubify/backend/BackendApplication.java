package com.hubify.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.hubify.backend.repositories.UserRepository;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.hubify.backend.repositories.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner diagnosticRunner(UserRepository userRepository, JdbcTemplate jdbcTemplate) {
		return args -> {
			System.out.println("--- DATABASE MAINTENANCE: DROPPING OBSOLETE TABLE ---");
			try {
				jdbcTemplate.execute("DROP TABLE IF EXISTS conversation_views CASCADE");
				System.out.println("Table conversation_views dropped successfully.");
			} catch (Exception e) {
				System.err.println("Error dropping table: " + e.getMessage());
			}
			
			System.out.println("--- DIAGNOSTIC: REGISTERED USERS ---");
			userRepository.findAll().forEach(u -> 
				System.out.println("User: " + u.getUsername() + " | Email: " + u.getEmail())
			);
			System.out.println("------------------------------------");
		};
	}
}

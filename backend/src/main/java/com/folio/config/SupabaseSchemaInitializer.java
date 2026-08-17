package com.folio.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.io.File;

@Component
public class SupabaseSchemaInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SupabaseSchemaInitializer.class);
    private final DataSource dataSource;

    public SupabaseSchemaInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        log.info("Checking and applying Supabase database schema & RLS policies...");
        try {
            File schemaFile = new File("../supabase-schema.sql");
            if (!schemaFile.exists()) {
                schemaFile = new File("supabase-schema.sql");
            }

            if (schemaFile.exists()) {
                Resource resource = new FileSystemResource(schemaFile);
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resource);
                populator.setContinueOnError(true);
                populator.setIgnoreFailedDrops(true);
                populator.execute(dataSource);
                log.info("Supabase schema and RLS policies applied successfully!");
            } else {
                log.warn("supabase-schema.sql not found, skipping direct initialization.");
            }
        } catch (Exception e) {
            log.error("Note on schema initialization: {}", e.getMessage());
        }
    }
}

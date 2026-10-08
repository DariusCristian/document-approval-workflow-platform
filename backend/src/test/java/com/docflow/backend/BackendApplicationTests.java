package com.docflow.backend;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.env.Environment;

import com.docflow.backend.config.DevDataSeeder;
import com.docflow.backend.support.IntegrationTest;

class BackendApplicationTests extends IntegrationTest {

	@Autowired
	private ApplicationContext context;

	@Autowired
	private Environment environment;

	@Autowired
	private DataSource dataSource;

	@Test
	void context_loads_against_the_testcontainers_database() throws Exception {
		try (var connection = dataSource.getConnection()) {
			String url = connection.getMetaData().getURL();
			assertThat(url).isEqualTo(POSTGRES.getJdbcUrl());
			assertThat(url).doesNotContain("docflow_db");
		}
	}

	@Test
	void dev_profile_and_dev_data_seeder_are_not_active() {
		assertThat(environment.getActiveProfiles()).doesNotContain("dev");
		assertThat(context.getBeanNamesForType(DevDataSeeder.class)).isEmpty();
	}

	@Test
	void flyway_migrations_have_created_the_tables() {
		Integer tables = jdbcTemplate.queryForObject("""
				select count(*) from information_schema.tables
				where table_name in ('app_user', 'document', 'approval_decision', 'document_comment')
				""", Integer.class);
		assertThat(tables).isEqualTo(4);
	}

}

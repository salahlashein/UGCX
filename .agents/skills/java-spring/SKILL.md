---
name: java-spring
description: Comprehensive Java and Spring Boot skill encompassing architecture, implementation, testing, security, coding standards, and project creation.
---


# Java and Spring Boot


This is the canonical skill for Java and Spring Boot development. It consolidates patterns, security, testing, documentation, and coding standards.


## When to use


- Creating or modifying Spring Boot applications or Java projects.
- Structuring controller, service, repository, configuration, or security layers.
- Reviewing Spring Boot/Java code quality, structure, and production readiness.
- Writing unit, data-driven, MockMvc, or integration tests with JUnit 5 and Testcontainers.
- Implementing authentication, authorization, validation, or rate limiting.


## References


Detailed guidelines have been externalized into the following references. **Always consult these for specific implementation nuances:**


- [**Patterns & Standards**](references/patterns-and-standards.md): Architecture defaults, REST conventions, records/Optionals, exception handling, data access patterns, and code smells.
- [**Security**](references/security.md): Auth workflow (JWT), authorization (@PreAuthorize), input validation, CORS/CSRF, secrets management, and rate limiting.
- [**Testing & TDD**](references/testing-and-tdd.md): JUnit 5 standards, MockMvc web layer tests, integration testing profiles, data-driven tests, and JaCoCo coverage.
- [**Project Setup**](references/project-setup.md): Bootstrapping a project via `start.spring.io`, adding Docker Compose (Redis, Postgres, Mongo), and checking Java versions.
- [**Documentation**](references/documentation.md): Javadoc standards for public APIs, classes, and methods.


## Core Directives


1. **Immutability & Safety:** Prefer `record`, `@NonNull`, and constructor injection. Return `Optional` instead of nulls.
2. **Layered Architecture:** Keep controllers thin. Isolate business logic in `@Service`. Depend on domain DTOs instead of entities at API boundaries.
3. **Security by Default:** Validate all input with JSR-380 `@Valid`. Ensure proper CORS, parameterized queries, and hashed passwords.
4. **Test-Driven:** Write fast, independent, idempotent tests. Group by feature. Expect 80%+ coverage using JaCoCo.
5. **Observable:** Use SLF4J with parameterized logging. Avoid `System.out.println()`.


## Build and verification commands


| Gradle | Maven | Purpose |
| --- | --- | --- |
| `./gradlew bootRun` | `./mvnw spring-boot:run` | Run app locally |
| `./gradlew build` | `./mvnw package` | Build app and run tests |
| `./gradlew test` | `./mvnw test` | Run test suite |


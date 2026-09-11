---
name: springboot-tdd
description: Test-driven development for Spring Boot using JUnit 5, Mockito, MockMvc, Testcontainers, and JaCoCo. Use when adding features, fixing bugs, or refactoring.
---


# Spring Boot TDD Workflow


TDD guidance for Spring Boot services with 80%+ coverage (unit + integration).


## When to Use


- New features or endpoints
- Bug fixes or refactors
- Adding data access logic or security rules


## Workflow


1) Write tests first (they should fail)
2) Implement minimal code to pass
3) Refactor with tests green
4) Enforce coverage (JaCoCo)


## Unit Tests (JUnit 5 + Mockito)


```java
@ExtendWith(MockitoExtension.class)
class MarketServiceTest {
  @Mock MarketRepository repo;
  @InjectMocks MarketService service;


  @Test
  void createsMarket() {
        CreateMarketRequest req = new CreateMarketRequest("name", "desc", Instant.now(), List.of("cat"));
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));


        Market result = service.create(req);


        assertThat(result.name()).isEqualTo("name");
        verify(repo).save(any());
  }
}
```


Patterns:
- Arrange-Act-Assert
- Avoid partial mocks; prefer explicit stubbing
- Use `@ParameterizedTest` for variants


## Web Layer Tests (MockMvc)


```java
@WebMvcTest(MarketController.class)
class MarketControllerTest {
  @Autowired MockMvc mockMvc;
  @MockBean MarketService marketService;


  @Test
  void returnsMarkets() throws Exception {
        when(marketService.list(any())).thenReturn(Page.empty());


        mockMvc.perform(get("/api/markets"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
  }
}
```


## Integration Tests (SpringBootTest)


```java
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MarketIntegrationTest {
  @Autowired MockMvc mockMvc;


  @Test
  void createsMarket() throws Exception {
        mockMvc.perform(post("/api/markets")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
              {"name":"Test","description":"Desc","endDate":"2030-01-01T00:00:00Z","categories":["general"]}
            """))
          .andExpect(status().isCreated());
  }
}
```


## Persistence Tests (DataJpaTest)


```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestContainersConfig.class)
class MarketRepositoryTest {
  @Autowired MarketRepository repo;


  @Test
  void savesAndFinds() {
        MarketEntity entity = new MarketEntity();
        entity.setName("Test");
        repo.save(entity);


        Optional<MarketEntity> found = repo.findByName("Test");
        assertThat(found).isPresent();
  }
}
```


## Testcontainers


- Use reusable containers for Postgres/Redis to mirror production
- Wire via `@DynamicPropertySource` to inject JDBC URLs into Spring context


## Coverage (JaCoCo)


Maven snippet:
```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.14</version>
  <executions>
        <execution>
          <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
          <id>report</id>
          <phase>verify</phase>
          <goals><goal>report</goal></goals>
        </execution>
  </executions>
</plugin>
```


## Assertions


- Prefer AssertJ (`assertThat`) for readability
- For JSON responses, use `jsonPath`
- For exceptions: `assertThatThrownBy(...)`


## Test Data Builders


```java
class MarketBuilder {
  private String name = "Test";
  MarketBuilder withName(String name) { this.name = name; return this; }
  Market build() { return new Market(null, name, MarketStatus.ACTIVE); }
}
```


## CI Commands


- Maven: `mvn -T 4 test` or `mvn verify`
- Gradle: `./gradlew test jacocoTestReport`


**Remember**: Keep tests fast, isolated, and deterministic. Test behavior, not implementation details.




---
name: java-junit
description: 'Get best practices for JUnit 5 unit testing, including data-driven tests'
---


# JUnit 5+ Best Practices


Your goal is to help me write effective unit tests with JUnit 5, covering both standard and data-driven testing approaches.


## Project Setup


- Use a standard Maven or Gradle project structure.
- Place test source code in `src/test/java`.
- Include dependencies for `junit-jupiter-api`, `junit-jupiter-engine`, and `junit-jupiter-params` for parameterized tests.
- Use build tool commands to run tests: `mvn test` or `gradle test`.


## Test Structure


- Test classes should have a `Test` suffix, e.g., `CalculatorTest` for a `Calculator` class.
- Use `@Test` for test methods.
- Follow the Arrange-Act-Assert (AAA) pattern.
- Name tests using a descriptive convention, like `methodName_should_expectedBehavior_when_scenario`.
- Use `@BeforeEach` and `@AfterEach` for per-test setup and teardown.
- Use `@BeforeAll` and `@AfterAll` for per-class setup and teardown (must be static methods).
- Use `@DisplayName` to provide a human-readable name for test classes and methods.


## Standard Tests


- Keep tests focused on a single behavior.
- Avoid testing multiple conditions in one test method.
- Make tests independent and idempotent (can run in any order).
- Avoid test interdependencies.


## Data-Driven (Parameterized) Tests


- Use `@ParameterizedTest` to mark a method as a parameterized test.
- Use `@ValueSource` for simple literal values (strings, ints, etc.).
- Use `@MethodSource` to refer to a factory method that provides test arguments as a `Stream`, `Collection`, etc.
- Use `@CsvSource` for inline comma-separated values.
- Use `@CsvFileSource` to use a CSV file from the classpath.
- Use `@EnumSource` to use enum constants.


## Assertions


- Use the static methods from `org.junit.jupiter.api.Assertions` (e.g., `assertEquals`, `assertTrue`, `assertNotNull`).
- For more fluent and readable assertions, consider using a library like AssertJ (`assertThat(...).is...`).
- Use `assertThrows` or `assertDoesNotThrow` to test for exceptions.
- Group related assertions with `assertAll` to ensure all assertions are checked before the test fails.
- Use descriptive messages in assertions to provide clarity on failure.


## Mocking and Isolation


- Use a mocking framework like Mockito to create mock objects for dependencies.
- Use `@Mock` and `@InjectMocks` annotations from Mockito to simplify mock creation and injection.
- Use interfaces to facilitate mocking.


## Test Organization


- Group tests by feature or component using packages.
- Use `@Tag` to categorize tests (e.g., `@Tag("fast")`, `@Tag("integration")`).
- Use `@TestMethodOrder(MethodOrderer.OrderAnnotation.class)` and `@Order` to control test execution order when strictly necessary.
- Use `@Disabled` to temporarily skip a test method or class, providing a reason.
- Use `@Nested` to group tests in a nested inner class for better organization and structure.


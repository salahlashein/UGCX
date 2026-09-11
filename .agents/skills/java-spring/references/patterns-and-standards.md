---
name: springboot-patterns
description: Spring Boot architecture patterns, REST API design, layered services, data access, caching, async processing, and logging. Use for Java Spring Boot backend work.
---


# Spring Boot Development Patterns


Spring Boot architecture and API patterns for scalable, production-grade services.


## When to Activate


- Building REST APIs with Spring MVC or WebFlux
- Structuring controller → service → repository layers
- Configuring Spring Data JPA, caching, or async processing
- Adding validation, exception handling, or pagination
- Setting up profiles for dev/staging/production environments
- Implementing event-driven patterns with Spring Events or Kafka


## REST API Structure


```java
@RestController
@RequestMapping("/api/markets")
@Validated
class MarketController {
  private final MarketService marketService;


  MarketController(MarketService marketService) {
        this.marketService = marketService;
  }


  @GetMapping
  ResponseEntity<Page<MarketResponse>> list(
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "20") int size) {
        Page<Market> markets = marketService.list(PageRequest.of(page, size));
        return ResponseEntity.ok(markets.map(MarketResponse::from));
  }


  @PostMapping
  ResponseEntity<MarketResponse> create(@Valid @RequestBody CreateMarketRequest request) {
        Market market = marketService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(MarketResponse.from(market));
  }
}
```


## Repository Pattern (Spring Data JPA)


```java
public interface MarketRepository extends JpaRepository<MarketEntity, Long> {
  @Query("select m from MarketEntity m where m.status = :status order by m.volume desc")
  List<MarketEntity> findActive(@Param("status") MarketStatus status, Pageable pageable);
}
```


## Service Layer with Transactions


```java
@Service
public class MarketService {
  private final MarketRepository repo;


  public MarketService(MarketRepository repo) {
        this.repo = repo;
  }


  @Transactional
  public Market create(CreateMarketRequest request) {
        MarketEntity entity = MarketEntity.from(request);
        MarketEntity saved = repo.save(entity);
        return Market.from(saved);
  }
}
```


## DTOs and Validation


```java
public record CreateMarketRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 2000) String description,
        @NotNull @FutureOrPresent Instant endDate,
        @NotEmpty List<@NotBlank String> categories) {}


public record MarketResponse(Long id, String name, MarketStatus status) {
  static MarketResponse from(Market market) {
        return new MarketResponse(market.id(), market.name(), market.status());
  }
}
```


## Exception Handling


```java
@ControllerAdvice
class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiError.validation(message));
  }


  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiError> handleAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiError.of("Forbidden"));
  }


  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> handleGeneric(Exception ex) {
        // Log unexpected errors with stack traces
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiError.of("Internal server error"));
  }
}
```


## Caching


Requires `@EnableCaching` on a configuration class.


```java
@Service
public class MarketCacheService {
  private final MarketRepository repo;


  public MarketCacheService(MarketRepository repo) {
        this.repo = repo;
  }


  @Cacheable(value = "market", key = "#id")
  public Market getById(Long id) {
        return repo.findById(id)
            .map(Market::from)
            .orElseThrow(() -> new EntityNotFoundException("Market not found"));
  }


  @CacheEvict(value = "market", key = "#id")
  public void evict(Long id) {}
}
```


## Async Processing


Requires `@EnableAsync` on a configuration class.


```java
@Service
public class NotificationService {
  @Async
  public CompletableFuture<Void> sendAsync(Notification notification) {
        // send email/SMS
        return CompletableFuture.completedFuture(null);
  }
}
```


## Logging (SLF4J)


```java
@Service
public class ReportService {
  private static final Logger log = LoggerFactory.getLogger(ReportService.class);


  public Report generate(Long marketId) {
        log.info("generate_report marketId={}", marketId);
        try {
          // logic
        } catch (Exception ex) {
          log.error("generate_report_failed marketId={}", marketId, ex);
          throw ex;
        }
        return new Report();
  }
}
```


## Middleware / Filters


```java
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilter.class);


  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
          FilterChain filterChain) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
          filterChain.doFilter(request, response);
        } finally {
          long duration = System.currentTimeMillis() - start;
          log.info("req method={} uri={} status={} durationMs={}",
              request.getMethod(), request.getRequestURI(), response.getStatus(), duration);
        }
  }
}
```


## Pagination and Sorting


```java
PageRequest page = PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending());
Page<Market> results = marketService.list(page);
```


## Error-Resilient External Calls


```java
public <T> T withRetry(Supplier<T> supplier, int maxRetries) {
  int attempts = 0;
  while (true) {
        try {
          return supplier.get();
        } catch (Exception ex) {
          attempts++;
          if (attempts >= maxRetries) {
            throw ex;
          }
          try {
            Thread.sleep((long) Math.pow(2, attempts) * 100L);
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw ex;
          }
        }
  }
}
```


## Rate Limiting (Filter + Bucket4j)


**Security Note**: The `X-Forwarded-For` header is untrusted by default because clients can spoof it.
Only use forwarded headers when:
1. Your app is behind a trusted reverse proxy (nginx, AWS ALB, etc.)
2. You have registered `ForwardedHeaderFilter` as a bean
3. You have configured `server.forward-headers-strategy=NATIVE` or `FRAMEWORK` in application properties
4. Your proxy is configured to overwrite (not append to) the `X-Forwarded-For` header


When `ForwardedHeaderFilter` is properly configured, `request.getRemoteAddr()` will automatically
return the correct client IP from the forwarded headers. Without this configuration, use
`request.getRemoteAddr()` directly—it returns the immediate connection IP, which is the only
trustworthy value.


```java
@Component
public class RateLimitFilter extends OncePerRequestFilter {
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();


  /*
   * SECURITY: This filter uses request.getRemoteAddr() to identify clients for rate limiting.
   *
   * If your application is behind a reverse proxy (nginx, AWS ALB, etc.), you MUST configure
   * Spring to handle forwarded headers properly for accurate client IP detection:
   *
   * 1. Set server.forward-headers-strategy=NATIVE (for cloud platforms) or FRAMEWORK in
   *        application.properties/yaml
   * 2. If using FRAMEWORK strategy, register ForwardedHeaderFilter:
   *
   *        @Bean
   *        ForwardedHeaderFilter forwardedHeaderFilter() {
   *            return new ForwardedHeaderFilter();
   *        }
   *
   * 3. Ensure your proxy overwrites (not appends) the X-Forwarded-For header to prevent spoofing
   * 4. Configure server.tomcat.remoteip.trusted-proxies or equivalent for your container
   *
   * Without this configuration, request.getRemoteAddr() returns the proxy IP, not the client IP.
   * Do NOT read X-Forwarded-For directly—it is trivially spoofable without trusted proxy handling.
   */
  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
          FilterChain filterChain) throws ServletException, IOException {
        // Use getRemoteAddr() which returns the correct client IP when ForwardedHeaderFilter
        // is configured, or the direct connection IP otherwise. Never trust X-Forwarded-For
        // headers directly without proper proxy configuration.
        String clientIp = request.getRemoteAddr();


        Bucket bucket = buckets.computeIfAbsent(clientIp,
            k -> Bucket.builder()
                .addLimit(Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1))))
                .build());


        if (bucket.tryConsume(1)) {
          filterChain.doFilter(request, response);
        } else {
          response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        }
  }
}
```


## Background Jobs


Use Spring’s `@Scheduled` or integrate with queues (e.g., Kafka, SQS, RabbitMQ). Keep handlers idempotent and observable.


## Observability


- Structured logging (JSON) via Logback encoder
- Metrics: Micrometer + Prometheus/OTel
- Tracing: Micrometer Tracing with OpenTelemetry or Brave backend


## Production Defaults


- Prefer constructor injection, avoid field injection
- Enable `spring.mvc.problemdetails.enabled=true` for RFC 7807 errors (Spring Boot 3+)
- Configure HikariCP pool sizes for workload, set timeouts
- Use `@Transactional(readOnly = true)` for queries
- Enforce null-safety via `@NonNull` and `Optional` where appropriate


**Remember**: Keep controllers thin, services focused, repositories simple, and errors handled centrally. Optimize for maintainability and testability.




---
name: java-coding-standards
description: "Java coding standards for Spring Boot services: naming, immutability, Optional usage, streams, exceptions, generics, and project layout."
---


# Java Coding Standards


Standards for readable, maintainable Java (17+) code in Spring Boot services.


## When to Activate


- Writing or reviewing Java code in Spring Boot projects
- Enforcing naming, immutability, or exception handling conventions
- Working with records, sealed classes, or pattern matching (Java 17+)
- Reviewing use of Optional, streams, or generics
- Structuring packages and project layout


## Core Principles


- Prefer clarity over cleverness
- Immutable by default; minimize shared mutable state
- Fail fast with meaningful exceptions
- Consistent naming and package structure


## Naming


```java
// PASS: Classes/Records: PascalCase
public class MarketService {}
public record Money(BigDecimal amount, Currency currency) {}


// PASS: Methods/fields: camelCase
private final MarketRepository marketRepository;
public Market findBySlug(String slug) {}


// PASS: Constants: UPPER_SNAKE_CASE
private static final int MAX_PAGE_SIZE = 100;
```


## Immutability


```java
// PASS: Favor records and final fields
public record MarketDto(Long id, String name, MarketStatus status) {}


public class Market {
  private final Long id;
  private final String name;
  // getters only, no setters
}
```


## Optional Usage


```java
// PASS: Return Optional from find* methods
Optional<Market> market = marketRepository.findBySlug(slug);


// PASS: Map/flatMap instead of get()
return market
        .map(MarketResponse::from)
        .orElseThrow(() -> new EntityNotFoundException("Market not found"));
```


## Streams Best Practices


```java
// PASS: Use streams for transformations, keep pipelines short
List<String> names = markets.stream()
        .map(Market::name)
        .filter(Objects::nonNull)
        .toList();


// FAIL: Avoid complex nested streams; prefer loops for clarity
```


## Exceptions


- Use unchecked exceptions for domain errors; wrap technical exceptions with context
- Create domain-specific exceptions (e.g., `MarketNotFoundException`)
- Avoid broad `catch (Exception ex)` unless rethrowing/logging centrally


```java
throw new MarketNotFoundException(slug);
```


## Generics and Type Safety


- Avoid raw types; declare generic parameters
- Prefer bounded generics for reusable utilities


```java
public <T extends Identifiable> Map<Long, T> indexById(Collection<T> items) { ... }
```


## Project Structure (Maven/Gradle)


```
src/main/java/com/example/app/
  config/
  controller/
  service/
  repository/
  domain/
  dto/
  util/
src/main/resources/
  application.yml
src/test/java/... (mirrors main)
```


## Formatting and Style


- Use 2 or 4 spaces consistently (project standard)
- One public top-level type per file
- Keep methods short and focused; extract helpers
- Order members: constants, fields, constructors, public methods, protected, private


## Code Smells to Avoid


- Long parameter lists → use DTO/builders
- Deep nesting → early returns
- Magic numbers → named constants
- Static mutable state → prefer dependency injection
- Silent catch blocks → log and act or rethrow


## Logging


```java
private static final Logger log = LoggerFactory.getLogger(MarketService.class);
log.info("fetch_market slug={}", slug);
log.error("failed_fetch_market slug={}", slug, ex);
```


## Null Handling


- Accept `@Nullable` only when unavoidable; otherwise use `@NonNull`
- Use Bean Validation (`@NotNull`, `@NotBlank`) on inputs


## Testing Expectations


- JUnit 5 + AssertJ for fluent assertions
- Mockito for mocking; avoid partial mocks where possible
- Favor deterministic tests; no hidden sleeps


**Remember**: Keep code intentional, typed, and observable. Optimize for maintainability over micro-optimizations unless proven necessary.




# Architecture and Configuration


## Project setup


- Use Maven (`pom.xml`) or Gradle (`build.gradle`) for dependency management.
- Prefer Spring Boot starters for cohesive dependency sets.


## Package and code organization


- Organize by feature or domain rather than by technical layer.
- Keep controllers focused on HTTP concerns.
- Keep services focused on business rules.
- Keep repositories focused on persistence concerns.
- Keep utility classes `final` with private constructors when static-only behavior is intended.


## Dependency injection and components


- Use constructor injection for required dependencies.
- Keep injected fields `private final`.
- Use stereotypes intentionally: `@RestController`, `@Service`, `@Repository`, and `@Component`.


## Configuration management


- Use `application.yml` for readable hierarchical configuration.
- Use profile-specific files such as `application-dev.yml` and `application-prod.yml`.
- Use `@ConfigurationProperties` for strongly-typed settings.
- Avoid hardcoded credentials and secrets.
- Source sensitive values from environment variables or managed secret stores.


## Web layer standards


- Design consistent REST endpoints.
- Use DTOs at API boundaries.
- Validate request payloads with JSR-380 annotations and `@Valid`.
- Return consistent error payloads via global exception handling.


## Logging standards


- Use SLF4J as the logging API.
- Use parameterized logging statements.
- Avoid `System.out.println()` for application logging.


# Implementation, Testing, and Security


## Service layer and transactions


- Keep business logic in `@Service` classes.
- Keep service operations stateless where feasible.
- Use `@Transactional` at service method boundaries where data consistency is required.
- Pass domain identifiers or DTOs through service boundaries when practical.


## Data access patterns


- Use Spring Data repositories (`JpaRepository` or `CrudRepository`) for standard persistence.
- Use `@Query` or Criteria API for advanced query needs.
- Use projections to load only required fields.
- Prefer parameterized query mechanisms and repository abstractions to avoid injection vulnerabilities.


## Testing strategy


- Add unit tests for service logic and utility behavior.
- Use Mockito for isolation in unit tests.
- Use `@SpringBootTest` for full integration scenarios.
- Use test slice annotations such as `@WebMvcTest` and `@DataJpaTest` when possible.
- Consider Testcontainers for database or broker integration fidelity.


## Security baseline


- Use Spring Security for authentication and authorization.
- Encode passwords with BCrypt.
- Validate and sanitize inputs appropriately.
- Ensure outputs are encoded where needed to avoid XSS vectors.


## Build verification expectations


- Ensure builds pass before handoff.
- Ensure tests pass as part of the build pipeline.
- Validate with Maven or Gradle according to project standard.
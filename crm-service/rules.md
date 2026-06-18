# crm-service Coding Standards

## Package Structure
- `com.aicrm.config` — Spring configuration beans
- `com.aicrm.common` — shared exceptions, DTOs, utilities
- `com.aicrm.security` — JWT filter, principal, security helpers
- `com.aicrm.module.{name}` — per-module Controller, Service, Repository, DTOs

## Conventions
- Controllers: `@RestController`, `@RequestMapping("/api/{module}")`, thin — delegate all logic to Service
- Services: `@Service`, `@Transactional` at method level (not class level)
- Repositories: `interface extends JpaRepository<Entity, String>`
- DTOs: Java `record` types — immutable, no setters
- Entities: Lombok `@Getter @Setter @NoArgsConstructor` — never use `@Data` on JPA entities

## Error Handling
- All exceptions extend `ApiException` (runtime)
- Throw `ApiException(ErrorCode.X, "message")` — never return null or raw HTTP status codes from services
- `GlobalExceptionHandler` converts to JSON — do not catch and suppress in controllers

## Security
- Never log JWT tokens, passwords, or password hashes at any level
- Never return `passwordHash` in any DTO or API response
- Use `SecurityContextHolder.getContext().getAuthentication()` to get current user in services
- Cast principal to `UserPrincipal` — never trust user-supplied userId from request body

## Caching
- Read methods: `@Cacheable(value = "cacheName", key = "#param")`
- Write methods: `@CacheEvict(value = "cacheName", key = "#param")`
- Dashboard aggregate: 5-minute TTL (configured per-cache in `RedisConfig`)
- All other caches: 24-hour TTL

## Validation
- Use `@Valid` on `@RequestBody` parameters in controllers
- Validation annotations on record fields: `@NotBlank`, `@Email`, `@Size`, `@NotNull`
- Custom business validation goes in the service layer, not the controller

## Testing
- Unit tests: Mockito — mock repositories, test service logic in isolation
- Integration tests: `@SpringBootTest` + Testcontainers — real PostgreSQL + Redis
- Test class naming: `{Subject}Test.java`
- Never test private methods — test public API behaviour

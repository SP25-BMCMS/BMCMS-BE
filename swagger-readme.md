# Swagger Documentation for BMCMS

This document explains how to use and access the Swagger documentation for the Building Management & Crack Monitoring System (BMCMS).

## Accessing Swagger UI

Once the application is running, you can access the Swagger UI at:

```
http://localhost:3000/api
```

## Features of the Swagger Documentation

The Swagger documentation provides:

1. **Interactive API Documentation**: Test API endpoints directly from the browser.
2. **Authentication Support**: Use JWT authentication with the "Authorize" button.
3. **Structured by Tags**: APIs are grouped by logical tags for easy navigation.
4. **Schema Documentation**: All DTOs and models are fully documented.
5. **Request/Response Examples**: Clear examples of payloads and responses.

## Authentication

To use authenticated endpoints:

1. Login using the `/auth/login` endpoint first
2. Click the "Authorize" button at the top of the Swagger UI
3. Enter your Bearer token (without the "Bearer" prefix) in the value field
4. Click "Authorize"
5. You can now access protected endpoints

## Endpoint Groups

The API is organized into the following main categories:

- **Authentication & User Management**: User registration, login, and profile management
- **Buildings**: Building CRUD operations
- **Areas**: Area management within buildings
- **Cracks**: Crack monitoring and reporting
- **Tasks**: Maintenance task management
- **Schedules**: Schedule management

## Development Notes

When adding new endpoints or DTOs, ensure proper Swagger documentation by:

1. Using `@ApiTags` to categorize endpoints
2. Using `@ApiOperation` to describe endpoint purpose
3. Using `@ApiResponse` to document possible responses
4. Using `@ApiBody` to document request bodies
5. Using `@ApiProperty` in DTOs to document properties
6. Using `@ApiParam` to document path parameters

Example:

```typescript
@Controller('example')
@ApiTags('examples')
export class ExampleController {
  @Get(':id')
  @ApiOperation({ summary: 'Get example by ID' })
  @ApiParam({ name: 'id', description: 'Example ID' })
  @ApiResponse({ status: 200, description: 'Example retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Example not found' })
  async getById(@Param('id') id: string) {
    // Implementation
  }
}
```

## Testing Swagger

You can test the Swagger setup using the provided `swagger-test.js` script:

```bash
node swagger-test.js
```

This will validate that Swagger UI and the API JSON are properly configured and accessible. 
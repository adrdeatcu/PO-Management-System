import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

// Thin wrapper around NestJS's built-in ValidationPipe with
// consistent error formatting across the whole API.
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true, // Strip properties not in the DTO
      forbidNonWhitelisted: true, // Throw if unknown properties are sent
      transform: true, // Auto-cast query params/path params to their DTO types
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Validation Error',
        });
      },
    });
  }
}

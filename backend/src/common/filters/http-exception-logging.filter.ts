import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { sanitizeHttpPath } from '../http/request-observability';

type ErrorResponseBody = {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
  error?: string;
};

function getHttpExceptionBody(exception: HttpException) {
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return {
      message: response,
    };
  }

  return response as Partial<ErrorResponseBody>;
}

@Catch()
export class HttpExceptionLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionLoggingFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionBody = isHttpException
      ? getHttpExceptionBody(exception)
      : {
          message: 'Error interno del servidor.',
          error:
            'Lo sentimos, no pudimos procesar la solicitud. Intente nuevamente.',
        };
    const safePath = sanitizeHttpPath(request.originalUrl);
    const responseBody: ErrorResponseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: safePath,
      message: exceptionBody.message ?? 'No pudimos procesar la solicitud.',
      ...(exceptionBody.error ? { error: exceptionBody.error } : {}),
    };
    const logMessage = `${request.method} ${safePath} -> ${status} | ${JSON.stringify(
      responseBody,
    )}`;

    if (status >= 500) {
      this.logger.error(logMessage);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json(responseBody);
  }
}

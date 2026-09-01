import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, user } = request;

    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && user) {
          // Audit logging is handled by individual services
        }
      }),
    );
  }
}

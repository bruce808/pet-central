import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    if (!MUTATING_METHODS.has(method)) return next.handle();

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const user = request.user;
        if (!user) return;

        try {
          await this.prisma.auditLog.create({
            data: {
              actorType: 'ADMIN_ACTOR',
              actorId: user.sub,
              actionType: `${method} ${request.route?.path || request.url}`,
              targetType: context.getClass().name,
              targetId: request.params?.id || 'unknown',
              metadataJson: {
                statusCode: context.switchToHttp().getResponse().statusCode,
                durationMs: Date.now() - startTime,
                ip: request.ip,
                userAgent: request.headers['user-agent'],
              },
            },
          });
        } catch {
          // Audit logging should never break the request
        }
      }),
    );
  }
}

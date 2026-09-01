import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";

@Injectable()
export class MasterOnlyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest();
    const isMaster = user?.roles?.some((r: { name: string }) => r.name === "MASTER");
    if (!isMaster) throw new ForbiddenException("Acesso restrito ao Master.");
    return true;
  }
}

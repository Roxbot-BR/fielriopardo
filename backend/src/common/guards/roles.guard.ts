import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

const HIERARCHY: Record<string, number> = { MASTER: 3, ADMIN: 2, USER: 1 };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user?.roles) return false;
    const minLevel = Math.min(...required.map((r) => HIERARCHY[r] ?? 0));
    const userLevel = Math.max(...(user.roles as any[]).map((r: any) => HIERARCHY[r.name] ?? 0));
    return userLevel >= minLevel;
  }
}

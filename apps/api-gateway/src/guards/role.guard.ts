import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ])

        if (!requiredRoles) {
            return true
        }

        const request = context.switchToHttp().getRequest()
        const user = request.user

        if (!user) {
            throw new ForbiddenException()
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException()
        }

        return true
    }
}

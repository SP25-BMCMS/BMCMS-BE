import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private JwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const authorzation = request.headers['authorization'];
    const token = authorzation.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const tokenPayload = await this.JwtService.verifyAsync(token);
      request.user = {
        sub: tokenPayload.sub,
        username: tokenPayload.username,
        role: tokenPayload.role,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException();
    }
  }
}

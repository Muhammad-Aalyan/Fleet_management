import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? 'fleet-secret',
    });
  }

  async validate(payload: { sub: number; email: string; role: string; sessionId: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();

    const session = await this.prisma.userSession.findUnique({ where: { sessionId: payload.sessionId } });
    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    return { id: user.id, email: user.email, role: user.role, sessionId: payload.sessionId };
  }
}

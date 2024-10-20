import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../token-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies.Authentication,
      ]),
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  // payload: TokenPayload -> TokenPayload only for TypeScript acknowledge, the JwtStrategy in backend side will auto
  // know what to validate (base all we need just config jwt module and how to get this jwt from request, in this case use
  // cookie-parser)
  validate(payload: TokenPayload) {
    return payload;
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UsersService } from '../../users/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'hello') {
  constructor(private readonly usersService: UsersService) {
    super({
      usernameField: 'email',
    });
  }

  // because local strategy is not highly wrapper like jwt strategy(like jwt module to config),
  // the validate function write by our own, the return in this method will attach to respond
  async validate(email: string, password: string) {
    try {
      return await this.usersService.verifyUser(email, password);
    } catch (err) {
      throw new UnauthorizedException(err);
    }
  }
}

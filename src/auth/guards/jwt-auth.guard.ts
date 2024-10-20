import { AuthGuard } from '@nestjs/passport';

// for example you can use guard and guard will use its responsible strategy
export class JwtAuthGuard extends AuthGuard('jwt') {}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/entities/user.entity';

// after validate in our `local.strategy.ts`, passport will return user in request(return in try catch block )
const getCurrentUserByContext = (context: ExecutionContext): User => {
  return context.switchToHttp().getResponse().user;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);

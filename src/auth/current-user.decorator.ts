import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

const getCurrentUserByContext = (context: ExecutionContext): User => {
  if (context.getType() === 'http') {
    // after validate in our `local.strategy.ts`, passport will return user in request(return in try catch block)
    return context.switchToHttp().getRequest().user;
  } else if (context.getType<GqlContextType>() === 'graphql') {
    // xx.user from jwt strategy
    return GqlExecutionContext.create(context).getContext().req.user;
  }
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);

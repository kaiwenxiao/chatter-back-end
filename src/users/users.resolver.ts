import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { TokenPayload } from '../auth/token-payload.interface';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  /*
    query {
      users {
        email
      }
    }
  */
  @Query(() => [User], { name: 'users' })
  // when add GqlAuthGuard which it is jwt mechanism will apply authorized system in this GraphQL query
  // in our project, we can use http /auth/login getting jwt in response's cookie firstly then attach it to this GraphQL query
  @UseGuards(GqlAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  /*
    query {
      user(_id: "123") {
        _id
      }
    }
   */
  @Query(() => User, { name: 'user' })
  @UseGuards(GqlAuthGuard)
  findOne(@Args('_id') _id: string) {
    return this.usersService.findOne(_id);
  }

  /*
    mutation {
      updateUser(updateUserInput: {
        email: "someemail@test.com",
        password: "somepwd123!"
      }) {
        email
        _id
      }
    }
   */
  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  updateUser(
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
    @CurrentUser() user: TokenPayload,
  ) {
    // user should only update themself - business logic
    // return this.usersService.update(updateUserInput._id, updateUserInput);

    return this.usersService.update(user._id, updateUserInput);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard)
  // removeUser(@Args('_id') _id: string) {
  removeUser(@CurrentUser() user: TokenPayload) {
    return this.usersService.remove(user._id);
  }

  /*
    query Me {
      me {
        _id
        email
      }
    }
  */
  @UseGuards(GqlAuthGuard)
  @Query(() => User, { name: 'me' })
  getMe(@CurrentUser() user: TokenPayload) {
    return user;
  }
}

import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';
import { S3Service } from '../common/s3/s3.service';
import { USERS_BUCKET, USERS_IMAGE_FILE_EXTENSION } from './users.constants';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UsersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async create(createUserInput: CreateUserInput) {
    try {
      return this.userRepository.create({
        ...createUserInput,
        password: await this.hashPassword(createUserInput.password),
      });
    } catch (error) {
      // E11000 comes from mongo
      if (error.messages.includes('E11000'))
        throw new UnprocessableEntityException('Email already exists');
      throw error;
    }
  }

  async uploadImage(file: Buffer, userId: string) {
    await this.s3Service.upload({
      bucket: USERS_BUCKET,
      key: `${userId}.${USERS_IMAGE_FILE_EXTENSION}`,
      file,
    });
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  // if we change the same name method with `resolver`, likes return a string here, the resolver method return type will change too
  async findAll() {
    return this.userRepository.find({});
  }

  findOne(_id: string) {
    return this.userRepository.findOne({ _id });
  }

  async update(_id: string, updateUserInput: UpdateUserInput) {
    if (updateUserInput.password) {
      updateUserInput.password = await this.hashPassword(
        updateUserInput.password,
      );
    }
    return this.userRepository.findOneAndUpdate(
      { _id },
      {
        $set: {
          ...updateUserInput,
          password: updateUserInput.password,
        },
      },
    );
  }

  async remove(_id: string) {
    return this.userRepository.findOneAndDelete({ _id });
  }

  async verifyUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ email });
    const passwordIsValida = await bcrypt.compare(password, user.password);

    if (!passwordIsValida) {
      throw new UnauthorizedException('Credentials did not valid.');
    }

    return user;
  }
}

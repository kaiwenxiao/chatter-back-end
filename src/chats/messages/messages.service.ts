import { Inject, Injectable } from '@nestjs/common';
import { ChatsRepository } from '../chats.repository';
import { Types } from 'mongoose';
import { CreateMessageInput } from './dto/create-message.input';
import { GetMessagesArgs } from './dto/get-messages.args';
import { PUB_SUB } from '../../constants/jection-tokens';
import { PubSub } from 'graphql-subscriptions';
import { MESSAGE_CREATED } from './constants/pub-triggers';
import { MessageCreatedArgs } from './dto/message-created.args';
import { MessageDocument } from './entities/message.document';
import { Message } from './entities/message.entity';
import { UsersService } from '../../users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly chatsRepository: ChatsRepository,
    private readonly usersService: UsersService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async createMessage({ content, chatId }: CreateMessageInput, userId: string) {
    const messageDocument: MessageDocument = {
      content,
      userId: new Types.ObjectId(userId),
      createdAt: new Date(),
      _id: new Types.ObjectId(),
    };

    await this.chatsRepository.findOneAndUpdate(
      {
        _id: chatId,
      },
      {
        $push: {
          messages: messageDocument,
        },
      },
    );
    const message: Message = {
      ...messageDocument,
      chatId,
      user: await this.usersService.findOne(userId),
    };
    await this.pubSub.publish(MESSAGE_CREATED, {
      messageCreated: message,
    });
    return message;
  }

  async countMessages(chatId: string) {
    return (
      await this.chatsRepository.model.aggregate([
        { $match: { _id: new Types.ObjectId(chatId) } },
        { $unwind: '$messages' },
        { $count: 'messages' },
      ])
    )[0];
  }

  async getMessages({ chatId, skip, limit }: GetMessagesArgs) {
    // return (
    //   await this.chatsRepository.findOne({
    //     _id: chatId,
    //   })
    // ).messages;
    // TODO
    const messages = await this.chatsRepository.model.aggregate([
      { $match: { _id: new Types.ObjectId(chatId) } },
      { $unwind: '$messages' },
      { $replaceRoot: { newRoot: '$messages' } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $unset: 'userId' },
      { $set: { chatId } },
    ]);

    for (const message of messages) {
      message.user = this.usersService.toEntity(message);
    }

    return messages;
  }

  async messageCreated() {
    return this.pubSub.asyncIterator(MESSAGE_CREATED);
  }
}

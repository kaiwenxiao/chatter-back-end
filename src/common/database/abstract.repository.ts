import { AbstractEntity } from './abstract.entity';
import { Logger, NotFoundException } from '@nestjs/common';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<T>) {}

  async create(document: Omit<T, '_id'>): Promise<T> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });

    // TODO
    return (await createdDocument.save()).toJSON() as unknown as T;
  }

  async findOne(filterQuery: FilterQuery<T>): Promise<T> {
    // second parameter means return whole entity(in other ORM call like entityManager&entity, but model&(schema/entity) in mongo),
    // and third one means javascript object rather than mongodb object
    // TODO
    // const document = await this.model.findOne(filterQuery, {}, { lean: true });
    const document = await this.model.findOne(filterQuery).lean<T>(true);

    if (!document) {
      this.logger.warn('Document was not found with filterQuery', filterQuery);
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<T> {
    const document = await this.model
      .findOneAndUpdate(filterQuery, update, {
        new: true,
      })
      // leave away from mongoose's property
      .lean<T>(true);

    if (!document) {
      this.logger.warn('Document was not found with filterQuery', filterQuery);
      throw new NotFoundException('Document not found.');
    }

    return document;
  }

  async find(filterQuery: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filterQuery).lean<T[]>(true);
  }

  async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T> {
    return this.model.findOneAndDelete(filterQuery).lean<T>(true);
  }
}

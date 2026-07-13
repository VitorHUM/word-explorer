import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DictionaryWordRepository } from './dictionary-word.repository';
import { FavoriteWordRepository } from './favorite-word.repository';
import { UserRepository } from './user.repository';
import { WordHistoryRepository } from './word-history.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    UserRepository,
    DictionaryWordRepository,
    FavoriteWordRepository,
    WordHistoryRepository,
  ],
  exports: [
    UserRepository,
    DictionaryWordRepository,
    FavoriteWordRepository,
    WordHistoryRepository,
  ],
})
export class RepositoriesModule {}

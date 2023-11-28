import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { SlackMessagesModule } from './slack-messages/slack-messages.module';

@Module({
  imports: [UsersModule, SlackMessagesModule],
  controllers: [AppController],
  providers: [AppService, PrismaModule],
})
export class AppModule {}

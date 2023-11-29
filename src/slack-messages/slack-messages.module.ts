import { Module } from '@nestjs/common';
import { SlackMessagesService } from './slack-messages.service';
import { SlackMessagesController } from './slack-messages.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PrismaModule } from 'src/common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SlackMessagesController],
  providers: [SlackMessagesService, PrismaService],
})
export class SlackMessagesModule {}

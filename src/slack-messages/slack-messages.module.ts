import { Module } from '@nestjs/common';
import { SlackMessagesService } from './slack-messages.service';
import { SlackMessagesController } from './slack-messages.controller';

@Module({
  controllers: [SlackMessagesController],
  providers: [SlackMessagesService],
})
export class SlackMessagesModule {}

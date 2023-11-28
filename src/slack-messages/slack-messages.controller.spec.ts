import { Test, TestingModule } from '@nestjs/testing';
import { SlackMessagesController } from './slack-messages.controller';
import { SlackMessagesService } from './slack-messages.service';

describe('SlackMessagesController', () => {
  let controller: SlackMessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlackMessagesController],
      providers: [SlackMessagesService],
    }).compile();

    controller = module.get<SlackMessagesController>(SlackMessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

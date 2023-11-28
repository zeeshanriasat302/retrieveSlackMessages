import { Test, TestingModule } from '@nestjs/testing';
import { SlackMessagesService } from './slack-messages.service';

describe('SlackMessagesService', () => {
  let service: SlackMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SlackMessagesService],
    }).compile();

    service = module.get<SlackMessagesService>(SlackMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { PartialType } from '@nestjs/swagger';
import { CreateSlackMessageDto } from './create-slack-message.dto';

export class UpdateSlackMessageDto extends PartialType(CreateSlackMessageDto) {}

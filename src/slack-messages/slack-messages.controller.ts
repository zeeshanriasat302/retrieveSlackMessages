import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SlackMessagesService } from './slack-messages.service';
import { CreateSlackMessageDto } from './dto/create-slack-message.dto';
import { UpdateSlackMessageDto } from './dto/update-slack-message.dto';
import { KeywordsDto } from './dto/keyword-filter.dto';
import { ApiBody } from '@nestjs/swagger';

@Controller('slack-messages')
export class SlackMessagesController {
  constructor(private readonly slackMessagesService: SlackMessagesService) {}

  @Post()
  create(@Body() createSlackMessageDto: CreateSlackMessageDto) {
    return this.slackMessagesService.create(createSlackMessageDto);
  }

  @Get('all-messages')
  async getAllMessages(): Promise<any[]> {
    return this.slackMessagesService.getAllMessages();
  }

  @Get('filtered-messages')
  async getFilteredMessages(): Promise<any[]> {
    return this.slackMessagesService.filteredMessages();
  }

  // @Post('filter-keyword')
  // // @ApiBody({ type: [String] }) // Define the request body schema
  //   async getKeywordFilteredMessages(@Body() keywordsDto: KeywordsDto): Promise<any[]> {
  //     console.log("keywordsDto 0---<", keywordsDto)
  //   return await this.slackMessagesService.keywordFilteredMessages(keywordsDto);
  // }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.slackMessagesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSlackMessageDto: UpdateSlackMessageDto,
  ) {
    return this.slackMessagesService.update(+id, updateSlackMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.slackMessagesService.remove(+id);
  }
}

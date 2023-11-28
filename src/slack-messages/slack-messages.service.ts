import { Injectable } from '@nestjs/common';
import { CreateSlackMessageDto } from './dto/create-slack-message.dto';
import { UpdateSlackMessageDto } from './dto/update-slack-message.dto';
import { WebClient } from '@slack/web-api';
import { KeywordsDto } from './dto/keyword-filter.dto';

@Injectable()
export class SlackMessagesService {
  private readonly slackClient: WebClient;

  constructor() {
    this.slackClient = new WebClient(
      'xoxp-6254393369029-6257323983730-6257253382835-73908cde10c1b7e3cf2647eaf99311e1',
    );
  }

  create(createSlackMessageDto: CreateSlackMessageDto) {
    return 'This action adds a new slackMessage';
  }

  // async getAllMessages(): Promise<any[]> {
  //   try {
  //     const conversations = await this.slackClient.conversations.list();
  //     const messages: any[] = [];

  //     // for (const conversation of conversations.channels.concat(conversations.ims)) {
  //     //   let result = null;
  //     //   console.log("conversation.id ----------> ", conversation?.id)
  //     //   if (conversation && conversation?.id !== undefined) {
  //     //    result = await this.slackClient.conversations.history({
  //     //     channel: conversation.id,
  //     //   });
  //     // } else {
  //     //   console.error("Conversation or ID is undefined:", conversation);
  //     // }

  //     //   if (result.messages && result.messages.length > 0) {
  //     //     messages.push(...result.messages);
  //     //   }
  //     // }
  //     // for (const conversation of conversations.channels.concat(conversations.ims)) {
  //     //   if (conversation && conversation.id !== undefined) {
  //     //     const channelId = conversation.id as string; // Convert to string
  //     //     try {
  //     //       const result = await this.slackClient.conversations.history({
  //     //         channel: channelId,
  //     //       });

  //     //       if (result.messages && result.messages.length > 0) {
  //     //         messages.push(...result.messages);
  //     //       }
  //     //     } catch (error) {
  //     //       // Handle specific errors or log them
  //     //       console.error(`Error fetching messages for channel ${channelId}: ${error}`);
  //     //       // Optionally skip this channel and continue with others
  //     //       continue;
  //     //     }
  //     //   } else {
  //     //     // Handle undefined or missing 'id' property
  //     //     console.error("Conversation or ID is undefined:", conversation);
  //     //     // Optionally skip this conversation or handle it differently
  //     //     continue;
  //     //   }
  //     // }
  //     for (const conversation of conversations.channels.concat(conversations.ims)) {
  //       if (conversation && conversation.id !== undefined) {
  //         const channelId = conversation.id as string; // Convert to string
  //         try {
  //           const result = await this.slackClient.conversations.history({
  //             channel: channelId,
  //           });

  //           if (result.messages && result.messages.length > 0) {
  //             const messagesWithTimestamp = result.messages.map((message) => {
  //               const timestamp = parseFloat(message.ts) * 1000; // Convert Unix timestamp to milliseconds
  //               const formattedTime = new Date(timestamp);
  //               return {
  //                 ...message,
  //                 timestamp: formattedTime, // Convert Unix timestamp to milliseconds
  //               };
  //             });

  //             messages.push(...messagesWithTimestamp);
  //           }
  //         } catch (error) {
  //           // Handle specific errors or log them
  //           console.error(`Error fetching messages for channel ${channelId}: ${error}`);
  //           // Optionally skip this channel and continue with others
  //           continue;
  //         }
  //       } else {
  //         // Handle undefined or missing 'id' property
  //         console.error("Conversation or ID is undefined:", conversation);
  //         // Optionally skip this conversation or handle it differently
  //         continue;
  //       }
  //     }

  //     return messages;
  //   } catch (error) {
  //     // Handle errors
  //     console.error(error);
  //     return [];
  //   }
  // }

  async getAllMessages(): Promise<any[]> {
    try {
      const conversations = await this.slackClient.conversations.list();
      const messages: any[] = [];

      for (const conversation of conversations.channels.concat(
        conversations.ims,
      )) {
        if (conversation && conversation.id !== undefined) {
          const channelId = conversation.id as string; // Convert to string
          try {
            const result = await this.slackClient.conversations.history({
              channel: channelId,
            });

            if (result.messages && result.messages.length > 0) {
              const messagesWithTimestamp = result.messages.map((message) => {
                const timestamp = parseFloat(message.ts) * 1000; // Convert Unix timestamp to milliseconds
                const formattedTime = new Date(timestamp);
                return {
                  ...message,
                  timestamp: formattedTime, // Convert Unix timestamp to milliseconds
                };
              });

              messages.push(...messagesWithTimestamp);
            }
          } catch (error) {
            // Handle specific errors or log them
            console.error(
              `Error fetching messages for channel ${channelId}: ${error}`,
            );
            // Optionally skip this channel and continue with others
            continue;
          }
        } else {
          // Handle undefined or missing 'id' property
          console.error('Conversation or ID is undefined:', conversation);
          // Optionally skip this conversation or handle it differently
          continue;
        }
      }

      return messages;
    } catch (error) {
      // Handle errors
      console.error(error);
      return [];
    }
  }

  async filteredMessages(): Promise<any[]> {
    const keywordsToFilter = ['afk', 'sign in', 'sign out', 'back'];
    try {
      const conversations = await this.slackClient.conversations.list();
      const messages: any[] = [];

      for (const conversation of conversations.channels.concat(
        conversations.ims,
      )) {
        if (conversation && conversation.id !== undefined) {
          const channelId = conversation.id as string; // Convert to string
          try {
            const result = await this.slackClient.conversations.history({
              channel: channelId,
            });

            if (result.messages && result.messages.length > 0) {
              const filteredMessages = result.messages.filter((message) => {
                return keywordsToFilter.some(
                  (keyword) =>
                    (message.text && message.text.includes(keyword)) ||
                    (message.blocks &&
                      message.blocks.some(
                        (block: any) =>
                          block.elements &&
                          block.elements.some(
                            (element: any) =>
                              element.text && element.text.includes(keyword),
                          ),
                      )),
                );
              });

              if (filteredMessages.length > 0) {
                const messagesWithTimestamp = filteredMessages.map(
                  (message) => {
                    const timestamp = parseFloat(message.ts) * 1000; // Convert Unix timestamp to milliseconds
                    const formattedTime = new Date(timestamp);
                    return {
                      ...message,
                      timestamp: formattedTime,
                    };
                  },
                );

                messages.push(...messagesWithTimestamp);
              }
            }
          } catch (error) {
            // Handle specific errors or log them
            console.error(
              `Error fetching messages for channel ${channelId}: ${error}`,
            );
            // Optionally skip this channel and continue with others
            continue;
          }
        } else {
          // Handle undefined or missing 'id' property
          console.error('Conversation or ID is undefined:', conversation);
          // Optionally skip this conversation or handle it differently
          continue;
        }
      }

      return messages;
    } catch (error) {
      // Handle errors
      console.error(error);
      return [];
    }
  }

  // async keywordFilteredMessages(keywordsToFilter: string[]): Promise<any[]> {

  // }

  // async keywordFilteredMessages(keywordsDto: KeywordsDto): Promise<any[]> {
  //   console.log("keywordsDto ---> ", keywordsDto)
  //   const keywordsToFilter = keywordsDto.keywordsToFilter;
  //   try {
  //     const conversations = await this.slackClient.conversations.list();
  //     const messages: any[] = [];

  //     for (const conversation of conversations.channels.concat(conversations.ims)) {
  //       if (conversation && conversation.id !== undefined) {
  //         const channelId = conversation.id as string; // Convert to string
  //         try {
  //           const result = await this.slackClient.conversations.history({
  //             channel: channelId,
  //           });

  //           if (result.messages && result.messages.length > 0) {
  //             const filteredMessages = result.messages.filter((message) => {
  //               return keywordsToFilter.some(keyword =>
  //                 (message.text && message.text.includes(keyword)) ||
  //                 (message.blocks && message.blocks.some((block: any) =>
  //                   block.elements && block.elements.some((element: any) =>
  //                     element.text && element.text.includes(keyword)
  //                   )
  //                 ))
  //               );
  //             });

  //             if (filteredMessages.length > 0) {
  //               const messagesWithTimestamp = filteredMessages.map((message) => {
  //                 const timestamp = parseFloat(message.ts) * 1000; // Convert Unix timestamp to milliseconds
  //                 const formattedTime = new Date(timestamp);
  //                 return {
  //                   ...message,
  //                   timestamp: formattedTime,
  //                 };
  //               });

  //               messages.push(...messagesWithTimestamp);
  //             }
  //           }
  //         } catch (error) {
  //           // Handle specific errors or log them
  //           console.error(`Error fetching messages for channel ${channelId}: ${error}`);
  //           // Optionally skip this channel and continue with others
  //           continue;
  //         }
  //       } else {
  //         // Handle undefined or missing 'id' property
  //         console.error("Conversation or ID is undefined:", conversation);
  //         // Optionally skip this conversation or handle it differently
  //         continue;
  //       }
  //     }

  //     return messages;
  //   } catch (error) {
  //     // Handle errors
  //     console.error(error);
  //     return [];
  //   }
  // }

  findOne(id: number) {
    return `This action returns a #${id} slackMessage`;
  }

  update(id: number, updateSlackMessageDto: UpdateSlackMessageDto) {
    return `This action updates a #${id} slackMessage`;
  }

  remove(id: number) {
    return `This action removes a #${id} slackMessage`;
  }
}

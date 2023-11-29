import { Injectable } from '@nestjs/common';
import { CreateSlackMessageDto } from './dto/create-slack-message.dto';
import { UpdateSlackMessageDto } from './dto/update-slack-message.dto';
import { WebClient } from '@slack/web-api';
import { KeywordsDto } from './dto/keyword-filter.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';


@Injectable()
export class SlackMessagesService {
  private readonly slackClient: WebClient;
  constructor(
    private readonly prisma: PrismaService
  ) {
    this.slackClient = new WebClient(
      'xoxp-6254393369029-6257323983730-6287046242704-e1d32348bb1ddbfc8a6e95865b28f94f',
    );
  }

  async create(createSlackMessageDto: CreateSlackMessageDto) {

    return 'This action adds a new slackMessage';
  }


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
    const keywordsToFilter = ['sign in', 'sign out', 'afk', 'back'];
    try {
      const conversations = await this.slackClient.conversations.list();
      const messages: any[] = [];
      const today = new Date(); // Get today's date
      today.setHours(23, 59, 59, 999);
      console.log(today, "Today")
  
      for (const conversation of conversations.channels.concat(conversations.ims)) {
        if (conversation?.id) {
          const channelId = conversation.id;
  
          try {
            const result = await this.slackClient.conversations.history({
              channel: channelId,
            });
  
            const filteredMessages = result.messages.filter((message) =>
              this.filterByKeywords(message, keywordsToFilter) &&
              this.isTodayMessage(message, today),
            );
  
            if (filteredMessages.length > 0) {
              const userIds = filteredMessages.map((message) => message.user);
              const usersInfoPromises = userIds.map((userId) =>
                this.slackClient.users.info({ user: userId }),
              );
              const usersInfo = await Promise.all(usersInfoPromises);
  
              const messagesObject = filteredMessages.map(
                (message, index) => {
                  const timestamp = parseFloat(message.ts) * 1000;
                  const formattedTime = new Date(timestamp);
  
                  console.log( formattedTime)
                  const data = {
                    slackId: message.user,
                    text: message.text,
                    timestamp: formattedTime,
                    username: usersInfo[index].user.real_name,
                    name: usersInfo[index].user.name,
                  };
                   this.saveMessagesToDatabase(data)

                  return {
                    slackId: message.user,
                    text: message.text,
                    timestamp: formattedTime,
                    username: usersInfo[index].user.real_name,
                    name: usersInfo[index].user.name,
                  };
                },
              );
              console.log("messagesObject ------>", messagesObject)
              messages.push(...messagesObject);
            }
          } catch (error) {
            console.error(`Error fetching messages for channel ${channelId}: ${error}`);
            continue;
          }
        } else {
          console.error('Conversation or ID is undefined:', conversation);
          continue;
        }
      }
  
      return messages;
    } catch (error) {
      console.error(error);
      return [];
    }
  }
  
  isTodayMessage(message: any, today: Date): boolean {
    const messageDate = new Date(parseFloat(message.ts) * 1000);
    return (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    );
  }
  
  filterByKeywords(message: any, keywords: string[]): boolean {
    if (!message || !message.text || !message.blocks) {
      return false;
    }
  
    const hasKeywordInText = keywords.some((keyword) =>
      message.text.includes(keyword),
    );
  
    const hasKeywordInBlocks = message.blocks.some((block: any) =>
      block.elements?.some(
        (element: any) =>
          element.text &&
          keywords.some((keyword) => element.text.includes(keyword)),
      ),
    );
  
    return hasKeywordInText || hasKeywordInBlocks;
  }
  
  async saveMessagesToDatabase(message: any): Promise<void> {
    // for (const message of messages) {
      try {
        console.log("message ---------> ", message.slackId, message.name)
        // Check if the user exists in the database
        let user = await this.prisma.user.findUnique({
          where: { slackId: message.slackId },
        });
        // console.log(" message.slackId 0-------------> ", message.slackId)
        console.log("user ----------> ", user)
        if (!user) {
          // If the user doesn't exist, create a new user record
          user = await this.prisma.user.create({
            data: {
              slackId: message.slackId,
              name: message.name,
            },
          });
        }

        // Create a session record
        // await this.prisma.session.create({
        //   data: {
        //     userId: user.id,
        //     signIn: message.timestamp,
        //     // Other session fields
        //   },
        // });

        // // Create an AFK record
        // await this.prisma.afk.create({
        //   data: {
        //     userId: user.id,
        //     sessionId: session.id, // Assuming you have session.id available
        //     afkStart: message.timestamp,
        //     // Other AFK fields
        //   },
        // });
      } catch (error) {
        console.error('Error saving message to the database:', error);
      }
    // }
  }


  // async filteredMessages(): Promise<any[]> {
  //   const keywordsToFilter = ['sign in', 'sign out', 'afk', 'back'];
  //   try {
  //     const conversations = await this.slackClient.conversations.list();
  //     const messages: any[] = [];
  
  //     for (const conversation of conversations.channels.concat(conversations.ims)) {
  //       if (conversation?.id) {
  //         const channelId = conversation.id; // No need to convert to string, it's already string type
  
  //         try {
  //           const result = await this.slackClient.conversations.history({
  //             channel: channelId,
  //           });
  
  //           const filteredMessages = result.messages.filter((message) =>
  //             this.filterByKeywords(message, keywordsToFilter),
  //           );
  
  //           if (filteredMessages.length > 0) {
  //             const userIds = filteredMessages.map((message) => message.user);
  //             const usersInfoPromises = userIds.map((userId) =>
  //               this.slackClient.users.info({ user: userId }),
  //             );
  //             const usersInfo = await Promise.all(usersInfoPromises);
  
  //             const messagesWithTimestamp = filteredMessages.map(
  //               (message, index) => {
  //                 const timestamp = parseFloat(message.ts) * 1000;
  //                 const formattedTime = new Date(timestamp);
  
  //                 const obj ={
  //                   slackId: message.user,
  //                   text: message.text,
  //                   timestamp: formattedTime,
  //                   username: usersInfo[index].user.real_name,
  //                   name: usersInfo[index].user.name,
  //                 }
  //                 return {
  //                   ...message,
  //                   slackId: message.user,
  //                   text: message.text,
  //                   timestamp: formattedTime,
  //                   username: usersInfo[index].user.real_name,
  //                   name: usersInfo[index].user.name,
  //                 };
  //               },
  //             );
  
  //             messages.push(...messagesWithTimestamp);
  //           }
  //         } catch (error) {
  //           console.error(`Error fetching messages for channel ${channelId}: ${error}`);
  //           continue;
  //         }
  //       } else {
  //         console.error('Conversation or ID is undefined:', conversation);
  //         continue;
  //       }
  //     }
  
  //     return messages;
  //   } catch (error) {
  //     console.error(error);
  //     return [];
  //   }
  // }
  
  // filterByKeywords(message: any, keywords: string[]): boolean {
  //   if (!message || !message.text || !message.blocks) {
  //     return false;
  //   }
  
  //   const hasKeywordInText = keywords.some((keyword) =>
  //     message.text.includes(keyword),
  //   );
  
  //   const hasKeywordInBlocks = message.blocks.some((block: any) =>
  //     block.elements?.some(
  //       (element: any) =>
  //         element.text &&
  //         keywords.some((keyword) => element.text.includes(keyword)),
  //     ),
  //   );
  
  //   return hasKeywordInText || hasKeywordInBlocks;
  // }
  



  async keywordFilteredMessages(keywordsDto: KeywordsDto): Promise<any[]> {
    console.log("keywordsDto ---> ", keywordsDto)
    const keywordsToFilter = keywordsDto.keywordsToFilter;
    try {
      const conversations = await this.slackClient.conversations.list();
      const messages: any[] = [];

      for (const conversation of conversations.channels.concat(conversations.ims)) {
        if (conversation && conversation.id !== undefined) {
          const channelId = conversation.id as string; // Convert to string
          try {
            const result = await this.slackClient.conversations.history({
              channel: channelId,
            });

            if (result.messages && result.messages.length > 0) {
              const filteredMessages = result.messages.filter((message) => {
                return keywordsToFilter.some(keyword =>
                  (message.text && message.text.includes(keyword)) ||
                  (message.blocks && message.blocks.some((block: any) =>
                    block.elements && block.elements.some((element: any) =>
                      element.text && element.text.includes(keyword)
                    )
                  ))
                );
              });

              if (filteredMessages.length > 0) {
                const messagesWithTimestamp = filteredMessages.map((message) => {
                  const timestamp = parseFloat(message.ts) * 1000; // Convert Unix timestamp to milliseconds
                  const formattedTime = new Date(timestamp);
                  return {
                    ...message,
                    timestamp: formattedTime,
                  };
                });

                messages.push(...messagesWithTimestamp);
              }
            }
          } catch (error) {
            // Handle specific errors or log them
            console.error(`Error fetching messages for channel ${channelId}: ${error}`);
            // Optionally skip this channel and continue with others
            continue;
          }
        } else {
          // Handle undefined or missing 'id' property
          console.error("Conversation or ID is undefined:", conversation);
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

  findOne(id: number) {
    
    return `This action returns a #${id} slackMessage`;
  }

  update(id: number, updateSlackMessageDto: UpdateSlackMessageDto) {
    return `This action updates a #${id} slackMessage`;
  }

  remove(id: number) {
    return `This action removes a #${id} slackMessage`;
  }

    // async filteredMessages(): Promise<any[]> {
  //   const keywordsToFilter = ['sign in', 'sign out', 'afk', 'back'];
  //   try {
  //     const conversations = await this.slackClient.conversations.list();
  //     const messages: any[] = [];

  //     for (const conversation of conversations.channels.concat(
  //       conversations.ims,
  //     )) {
  //       if (conversation && conversation.id !== undefined) {
  //         const channelId = conversation.id as string; // Convert to string
  //         try {
  //           const result = await this.slackClient.conversations.history({
  //             channel: channelId,
  //           });

  //           if (result.messages && result.messages.length > 0) {
  //             const filteredMessages = result.messages.filter((message) => {
  //               return keywordsToFilter.some(
  //                 (keyword) =>
  //                   (message.text && message.text.includes(keyword)) ||
  //                   (message.blocks &&
  //                     message.blocks.some(
  //                       (block: any) =>
  //                         block.elements &&
  //                         block.elements.some(
  //                           (element: any) =>
  //                             element.text && element.text.includes(keyword),
  //                         ),
  //                     )),
  //               );
  //             });

  //             if (filteredMessages.length > 0) {
  //               const messagesWithTimestamp = filteredMessages.map(
  //                 (message) => {
  //                   const timestamp = parseFloat(message.ts) * 1000; // Convert Unix timestamp to milliseconds
  //                   const formattedTime = new Date(timestamp);
  //                   return {
  //                     ...message,
  //                     timestamp: formattedTime,
  //                   };
  //                 },
  //               );

  //               messages.push(...messagesWithTimestamp);
  //             }
  //           }
  //         } catch (error) {
  //           // Handle specific errors or log them
  //           console.error(
  //             `Error fetching messages for channel ${channelId}: ${error}`,
  //           );
  //           // Optionally skip this channel and continue with others
  //           continue;
  //         }
  //       } else {
  //         // Handle undefined or missing 'id' property
  //         console.error('Conversation or ID is undefined:', conversation);
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

  // async keywordFilteredMessages(keywordsToFilter: string[]): Promise<any[]> {

  // }

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

}

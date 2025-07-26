import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { UserQueryDto } from './dto/user-query.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async handleChat(@Body() userQueryDto: UserQueryDto) {
    return this.chatService.processUserQuery(userQueryDto.query);
  }
}

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from 'src/decorators/public.decorator';
import { ResponseMessage } from 'src/decorators/response-message.decorator';
import { User } from 'src/decorators/user.decorator';
import { JwtDecoded } from 'src/guards/jwt.strategy';
import { CreateUserSignUpDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @ResponseMessage('Create user successfully')
  @Post('create-user-sign-up')
  async createUserSignUp(@Body() createUserSignUpDto: CreateUserSignUpDto) {
    return await this.usersService.createUserSignUp(createUserSignUpDto);
  }

  @ResponseMessage('User details retrieved successfully')
  @Get(':id')
  async getUserDetails(@Param('id') id: string, @User() user: JwtDecoded) {
    return await this.usersService.getUserDetailsById(id, user);
  }
}

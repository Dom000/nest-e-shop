import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { User, UserType } from '@prisma/client';
import { GetUser } from 'src/auth/decorator/get.user.decorator';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { UpdateUserDto } from './dto/user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@Controller('/milesapi/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  //get all users
  @UseGuards(JwtGuard)
  @Get('/users')
  getUsers(@GetUser() user: User) {
    if (user.role !== UserType.ADMIN) {
      throw new UnauthorizedException('You are not an admin.');
    }
    return this.userService.getUsers();
  }

  //get user by username
  @UseGuards(JwtGuard)
  @Get('/my-profile')
  getUser(@GetUser() user: User) {
    return this.userService.getUser(user.username);
  }

  //update user
  @UseGuards(JwtGuard)
  @Patch('/update/:username')
  @UseInterceptors(FileInterceptor('image'))
  updateUser(
    @UploadedFile() file: Express.Multer.File,
    @Param('username') username: string,
    @Body() body: UpdateUserDto,
    @GetUser() user: User,
  ) {
    return this.userService.updateUser(file, body, user, username);
  }

  //delete user
  @UseGuards(JwtGuard)
  @Delete('/delete/:username')
  deleteUser(@Param('username') username: string, @GetUser() user: User) {
    if (!user) {
      throw new ForbiddenException('You are not authorized.');
    }
    return this.userService.deleteUser(username, user);
  }
}

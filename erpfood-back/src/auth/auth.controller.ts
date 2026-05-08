import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: 'jwt',
        tokenType: 'Bearer',
        permissions: ['permission.read'],
        user: {
          id: 1,
          nome: 'Admin',
          email: 'admin@empresa.com',
          role: 'admin',
        },
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.senha);
  }

  @Post('saas/login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    schema: {
      example: {
        accessToken: 'jwt',
        tokenType: 'Bearer',
        permissions: ['saas.manage'],
        user: {
          id: 1,
          nome: 'SaaS Admin',
          email: 'admin@saas.seumenu.com.br',
          role: 'saas_admin',
        },
      },
    },
  })
  loginSaas(@Body() loginDto: LoginDto) {
    return this.authService.loginSaas(loginDto.email, loginDto.senha);
  }
}

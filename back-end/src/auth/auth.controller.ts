import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto, SignInDto, SignUpDto } from './dtos/auth.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cadastrar um novo usuário',
  })
  @ApiOkResponse({
    description: 'Usuário cadastrado com sucesso.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha na validação do corpo da requisição.',
    content: {
      'application/json': {
        example: {
          message: 'Os dados enviados na requisição são inválidos.',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'Já existe um usuário cadastrado com este e-mail.',
    content: {
      'application/json': {
        example: {
          message: 'Já existe um usuário cadastrado com este e-mail.',
        },
      },
    },
  })
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticar um usuário existente',
  })
  @ApiOkResponse({
    description: 'Usuário autenticado com sucesso.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha na validação do corpo da requisição.',
    content: {
      'application/json': {
        example: {
          message: 'Os dados enviados na requisição são inválidos.',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'E-mail ou senha inválidos.',
    content: {
      'application/json': {
        example: {
          message: 'E-mail ou senha inválidos.',
        },
      },
    },
  })
  signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }
}

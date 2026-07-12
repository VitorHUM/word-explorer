import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
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
  @ApiOperation({
    summary: 'Cadastrar um novo usuário',
  })
  @ApiCreatedResponse({
    description: 'Usuário cadastrado com sucesso.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha na validação do corpo da requisição.',
    content: {
      'application/json': {
        example: {
          message: 'Os dados enviados na requisição são inválidos.',
          error: 'Bad Request',
          statusCode: 400,
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
          error: 'Conflict',
          statusCode: 409,
        },
      },
    },
  })
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  @ApiOperation({
    summary: 'Autenticar um usuário existente',
  })
  @ApiCreatedResponse({
    description: 'Usuário autenticado com sucesso.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Falha na validação do corpo da requisição.',
    content: {
      'application/json': {
        example: {
          message: 'Os dados enviados na requisição são inválidos.',
          error: 'Bad Request',
          statusCode: 400,
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
          error: 'Unauthorized',
          statusCode: 401,
        },
      },
    },
  })
  signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto);
  }
}

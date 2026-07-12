import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

class EntryPhoneticDto {
  @ApiProperty({ example: '/faɪə/', required: false })
  text?: string;

  @ApiProperty({ example: 'https://audio.example/fire.mp3', required: false })
  audio?: string;
}

class EntryDefinitionDto {
  @ApiProperty({ example: 'Combustion or burning.' })
  definition!: string;

  @ApiProperty({ example: 'The fire was warm.', required: false })
  example?: string;

  @ApiProperty({ example: ['blaze'], type: [String] })
  synonyms!: string[];

  @ApiProperty({ example: ['ice'], type: [String] })
  antonyms!: string[];
}

class EntryMeaningDto {
  @ApiProperty({ example: 'noun', required: false })
  partOfSpeech?: string;

  @ApiProperty({ type: [EntryDefinitionDto] })
  definitions!: EntryDefinitionDto[];

  @ApiProperty({ example: ['flame'], type: [String] })
  synonyms!: string[];

  @ApiProperty({ example: ['water'], type: [String] })
  antonyms!: string[];
}

export class EntryDetailsDto {
  @ApiProperty({ example: 'fire' })
  word!: string;

  @ApiProperty({ type: [EntryPhoneticDto] })
  phonetics!: EntryPhoneticDto[];

  @ApiProperty({ type: [EntryMeaningDto] })
  meanings!: EntryMeaningDto[];

  @ApiProperty({ example: ['https://source.example/fire'], type: [String] })
  sourceUrls!: string[];
}

export class EntryWordParamDto {
  @ApiProperty({ example: 'fire' })
  @IsString({ message: 'word deve ser um texto.' })
  @IsNotEmpty({ message: 'word é obrigatório.' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  word!: string;
}

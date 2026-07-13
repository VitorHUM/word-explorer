import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { serializeDto } from '../../common/utils/serialization.util';

@Exclude()
class EntryPhoneticDto {
  @ApiProperty({ example: '/faɪə/', required: false })
  @Expose()
  text?: string;

  @ApiProperty({ example: 'https://audio.example/fire.mp3', required: false })
  @Expose()
  audio?: string;
}

@Exclude()
class EntryDefinitionDto {
  @ApiProperty({ example: 'Combustion or burning.' })
  @Expose()
  definition!: string;

  @ApiProperty({ example: 'The fire was warm.', required: false })
  @Expose()
  example?: string;

  @ApiProperty({ example: ['blaze'], type: [String] })
  @Expose()
  synonyms!: string[];

  @ApiProperty({ example: ['ice'], type: [String] })
  @Expose()
  antonyms!: string[];
}

@Exclude()
class EntryMeaningDto {
  @ApiProperty({ example: 'noun', required: false })
  @Expose()
  partOfSpeech?: string;

  @ApiProperty({ type: [EntryDefinitionDto] })
  @Expose()
  @Type(() => EntryDefinitionDto)
  definitions!: EntryDefinitionDto[];

  @ApiProperty({ example: ['flame'], type: [String] })
  @Expose()
  synonyms!: string[];

  @ApiProperty({ example: ['water'], type: [String] })
  @Expose()
  antonyms!: string[];
}

@Exclude()
export class EntryDetailsDto {
  @ApiProperty({ example: 'fire' })
  @Expose()
  word!: string;

  @ApiProperty({ type: [EntryPhoneticDto] })
  @Expose()
  @Type(() => EntryPhoneticDto)
  phonetics!: EntryPhoneticDto[];

  @ApiProperty({ type: [EntryMeaningDto] })
  @Expose()
  @Type(() => EntryMeaningDto)
  meanings!: EntryMeaningDto[];

  @ApiProperty({ example: ['https://source.example/fire'], type: [String] })
  @Expose()
  sourceUrls!: string[];

  static from(data: {
    word: string;
    phonetics: Array<{ text?: string; audio?: string }>;
    meanings: Array<{
      partOfSpeech?: string;
      definitions: Array<{
        definition: string;
        example?: string;
        synonyms: string[];
        antonyms: string[];
      }>;
      synonyms: string[];
      antonyms: string[];
    }>;
    sourceUrls: string[];
  }): EntryDetailsDto {
    return serializeDto(EntryDetailsDto, data);
  }
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

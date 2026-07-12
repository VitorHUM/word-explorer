export interface FreeDictionaryResult {
  word: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  sourceUrls: string[];
}

export type DictionaryEntryCacheStatus = 'HIT' | 'MISS';

export interface FreeDictionaryClientResult {
  entry: FreeDictionaryResult;
  cacheStatus: DictionaryEntryCacheStatus;
}

export interface DictionaryPhonetic {
  text?: string;
  audio?: string;
}

export interface DictionaryMeaning {
  partOfSpeech?: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface FreeDictionaryApiEntry {
  word?: unknown;
  phonetics?: unknown;
  meanings?: unknown;
  sourceUrls?: unknown;
}

export interface FreeDictionaryApiPhonetic {
  text?: unknown;
  audio?: unknown;
}

export interface FreeDictionaryApiMeaning {
  partOfSpeech?: unknown;
  definitions?: unknown;
  synonyms?: unknown;
  antonyms?: unknown;
}

export interface FreeDictionaryApiDefinition {
  definition?: unknown;
  example?: unknown;
  synonyms?: unknown;
  antonyms?: unknown;
}

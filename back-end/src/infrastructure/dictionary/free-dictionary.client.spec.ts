import {
  BadGatewayException,
  GatewayTimeoutException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { AppConfigService } from '../config/app-config.service';
import { FreeDictionaryClient } from './free-dictionary.client';

interface FetchLikeResponseMock {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

type FetchLikeMock = (
  input: string,
  init?: { signal?: AbortSignal },
) => Promise<FetchLikeResponseMock>;

describe('FreeDictionaryClient', () => {
  const createAppConfigService = (): AppConfigService => {
    const appConfigService = Object.create(
      AppConfigService.prototype,
    ) as AppConfigService;

    Object.defineProperty(appConfigService, 'dictionaryApiUrl', {
      value: 'https://api.dictionaryapi.dev/api/v2',
      configurable: true,
      enumerable: true,
    });
    Object.defineProperty(appConfigService, 'dictionaryCacheTtlSeconds', {
      value: 3600,
      configurable: true,
      enumerable: true,
    });

    return appConfigService;
  };

  const createCacheService = (): CacheService => {
    const cacheService = Object.create(CacheService.prototype) as CacheService;

    Object.assign(cacheService, {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
    });

    return cacheService;
  };

  it('should map a valid dictionary response preserving only relevant fields', async () => {
    const fetchMock: FetchLikeMock = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve([
            {
              word: 'fire',
              phonetics: [
                { text: '/faɪə/' },
                { audio: 'https://audio.example/fire.mp3' },
              ],
              meanings: [
                {
                  partOfSpeech: 'noun',
                  definitions: [
                    {
                      definition: 'Combustion or burning.',
                      example: 'The fire was warm.',
                      synonyms: ['blaze'],
                      antonyms: ['ice'],
                    },
                  ],
                  synonyms: ['flame'],
                  antonyms: ['water'],
                },
              ],
              sourceUrls: ['https://source.example/fire'],
            },
          ]),
      });
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).resolves.toEqual({
      word: 'fire',
      phonetics: [
        { text: '/faɪə/', audio: undefined },
        { text: undefined, audio: 'https://audio.example/fire.mp3' },
      ],
      meanings: [
        {
          partOfSpeech: 'noun',
          definitions: [
            {
              definition: 'Combustion or burning.',
              example: 'The fire was warm.',
              synonyms: ['blaze'],
              antonyms: ['ice'],
            },
          ],
          synonyms: ['flame'],
          antonyms: ['water'],
        },
      ],
      sourceUrls: ['https://source.example/fire'],
    });
  });

  it('should encode the requested word in the URL', async () => {
    const fetchMock = jest.fn<
      ReturnType<FetchLikeMock>,
      Parameters<FetchLikeMock>
    >(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ word: 'ice cream' }]),
      }),
    );
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await client.getEnglishEntry('ice cream');

    const callArguments = fetchMock.mock.calls.at(0);

    expect(callArguments).toBeDefined();

    if (!callArguments) {
      throw new Error('Expected fetch to be called.');
    }

    const [calledUrl, calledInit] = callArguments;

    expect(calledUrl).toBe(
      'https://api.dictionaryapi.dev/api/v2/entries/en/ice%20cream',
    );
    expect(calledInit?.signal).toBeInstanceOf(AbortSignal);
  });

  it('should map a missing word to NotFoundException', async () => {
    const fetchMock: FetchLikeMock = () =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      });
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('missing')).rejects.toThrow(
      new NotFoundException('Palavra não encontrada no dicionário.'),
    );
  });

  it('should map timeouts to GatewayTimeoutException', async () => {
    const abortError = new Error('aborted');

    abortError.name = 'AbortError';

    const fetchMock: FetchLikeMock = () => Promise.reject(abortError);
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).rejects.toThrow(
      new GatewayTimeoutException(
        'A consulta ao serviço de dicionário excedeu o tempo limite.',
      ),
    );
  });

  it('should map network failures to ServiceUnavailableException', async () => {
    const fetchMock: FetchLikeMock = () =>
      Promise.reject(new TypeError('fetch failed'));
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).rejects.toThrow(
      new ServiceUnavailableException(
        'Não foi possível se comunicar com o serviço de dicionário.',
      ),
    );
  });

  it('should map invalid payloads to BadGatewayException', async () => {
    const fetchMock: FetchLikeMock = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ invalid: true }]),
      });
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).rejects.toThrow(
      new BadGatewayException(
        'O serviço de dicionário retornou uma resposta inválida.',
      ),
    );
  });

  it('should map external unavailability to ServiceUnavailableException', async () => {
    const fetchMock: FetchLikeMock = () =>
      Promise.resolve({
        ok: false,
        status: 503,
        json: () => Promise.resolve({}),
      });
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      createCacheService(),
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).rejects.toThrow(
      new ServiceUnavailableException(
        'O serviço de dicionário está indisponível no momento.',
      ),
    );
  });

  it('should return the cached entry on HIT', async () => {
    const cacheService = createCacheService();
    const cachedEntry = {
      word: 'fire',
      phonetics: [],
      meanings: [],
      sourceUrls: [],
    };

    jest.spyOn(cacheService, 'getJson').mockResolvedValue(cachedEntry);
    const fetchMock = jest.fn<
      ReturnType<FetchLikeMock>,
      Parameters<FetchLikeMock>
    >();
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      cacheService,
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).resolves.toEqual(cachedEntry);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should store the mapped entry with TTL on MISS', async () => {
    const cacheService = createCacheService();
    const setJsonSpy = jest.spyOn(cacheService, 'setJson');
    const fetchMock: FetchLikeMock = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ word: 'fire', meanings: [] }]),
      });
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      cacheService,
    ).setFetchImplementation(fetchMock);

    await client.getEnglishEntry('fire');

    expect(setJsonSpy).toHaveBeenCalledWith(
      'dictionary:entry:en:fire',
      {
        word: 'fire',
        phonetics: [],
        meanings: [],
        sourceUrls: [],
      },
      3600,
    );
  });

  it('should treat invalid cache as MISS and fallback to the external API', async () => {
    const cacheService = createCacheService();
    const fetchMock = jest.fn<
      ReturnType<FetchLikeMock>,
      Parameters<FetchLikeMock>
    >(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ word: 'fire', meanings: [] }]),
      }),
    );
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      cacheService,
    ).setFetchImplementation(fetchMock);

    await client.getEnglishEntry('fire');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should tolerate Redis unavailability and still return the external result', async () => {
    const cacheService = createCacheService();

    jest.spyOn(cacheService, 'getJson').mockResolvedValue(null);
    jest.spyOn(cacheService, 'setJson').mockResolvedValue(undefined);
    const fetchMock: FetchLikeMock = () =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ word: 'fire', meanings: [] }]),
      });
    const client = new FreeDictionaryClient(
      createAppConfigService(),
      cacheService,
    ).setFetchImplementation(fetchMock);

    await expect(client.getEnglishEntry('fire')).resolves.toEqual({
      word: 'fire',
      phonetics: [],
      meanings: [],
      sourceUrls: [],
    });
  });
});

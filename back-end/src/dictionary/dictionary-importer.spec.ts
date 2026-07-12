import {
  chunkWords,
  fetchDictionarySource,
  normalizeDictionaryWord,
  prepareDictionaryWords,
} from './dictionary-importer';

describe('dictionaryImporter', () => {
  describe('normalizeDictionaryWord', () => {
    it('should normalize words to lowercase and trim external spaces', () => {
      expect(normalizeDictionaryWord('  Fire  ')).toBe('fire');
    });

    it('should discard words with internal whitespace', () => {
      expect(normalizeDictionaryWord('ice cream')).toBeNull();
    });

    it('should discard empty words', () => {
      expect(normalizeDictionaryWord('   ')).toBeNull();
    });
  });

  describe('prepareDictionaryWords', () => {
    it('should interpret object keys as words, deduplicate, and normalize values', () => {
      const preparedWords = prepareDictionaryWords({
        Fire: 1,
        ' fire ': true,
        WATER: {},
        'ice cream': 'invalid',
        '   ': 'invalid',
      });

      expect(preparedWords).toEqual({
        receivedCount: 5,
        validCount: 2,
        words: ['fire', 'water'],
      });
    });
  });

  describe('chunkWords', () => {
    it('should split words into fixed-size batches', () => {
      expect(chunkWords(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e'],
      ]);
    });
  });

  describe('fetchDictionarySource', () => {
    it('should return the parsed payload when the response is successful', async () => {
      const payload = await fetchDictionarySource(
        () =>
          Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ fire: 1 }),
          }),
        'https://example.com/words.json',
        10,
      );

      expect(payload).toEqual({ fire: 1 });
    });

    it('should fail when the HTTP status is invalid', async () => {
      await expect(
        fetchDictionarySource(
          () =>
            Promise.resolve({
              ok: false,
              status: 503,
              json: () => Promise.resolve({}),
            }),
          'https://example.com/words.json',
          10,
        ),
      ).rejects.toThrow(
        'Falha ao baixar o arquivo de palavras. Status HTTP: 503.',
      );
    });

    it('should fail when the payload format is invalid', async () => {
      await expect(
        fetchDictionarySource(
          () =>
            Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve(['fire']),
            }),
          'https://example.com/words.json',
          10,
        ),
      ).rejects.toThrow(
        'O arquivo de palavras baixado possui um formato inválido.',
      );
    });
  });
});

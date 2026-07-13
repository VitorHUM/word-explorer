import { z } from "zod";

export const apiErrorSchema = z.object({
  message: z.string(),
});

export const authResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  token: z.string(),
});

export const profileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const paginationSchema = z.object({
  totalDocs: z.number(),
  page: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const paginatedWordsSchema = paginationSchema.extend({
  results: z.array(z.string()),
});

export const wordListItemSchema = z.object({
  word: z.string(),
  added: z.string(),
});

export const paginatedUserWordsSchema = paginationSchema.extend({
  results: z.array(wordListItemSchema),
});

export const wordDetailsSchema = z.object({
  word: z.string(),
  phonetics: z.array(
    z.object({
      text: z.string().optional(),
      audio: z.string().optional(),
    }),
  ),
  meanings: z.array(
    z.object({
      partOfSpeech: z.string().optional(),
      definitions: z.array(
        z.object({
          definition: z.string(),
          example: z.string().optional(),
          synonyms: z.array(z.string()),
          antonyms: z.array(z.string()),
        }),
      ),
      synonyms: z.array(z.string()),
      antonyms: z.array(z.string()),
    }),
  ),
  sourceUrls: z.array(z.string()),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type UserProfile = z.infer<typeof profileSchema>;
export type PaginatedWords = z.infer<typeof paginatedWordsSchema>;
export type PaginatedUserWords = z.infer<typeof paginatedUserWordsSchema>;
export type WordDetails = z.infer<typeof wordDetailsSchema>;

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionary_words" (
    "id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dictionary_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_words" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "word_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "word_history" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "word_id" UUID NOT NULL,
    "viewed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "word_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dictionary_words_value_key" ON "dictionary_words"("value");

-- CreateIndex
CREATE INDEX "favorite_words_user_id_created_at_idx" ON "favorite_words"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_words_user_id_word_id_key" ON "favorite_words"("user_id", "word_id");

-- CreateIndex
CREATE INDEX "word_history_user_id_viewed_at_idx" ON "word_history"("user_id", "viewed_at");

-- AddForeignKey
ALTER TABLE "favorite_words" ADD CONSTRAINT "favorite_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_words" ADD CONSTRAINT "favorite_words_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "dictionary_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_history" ADD CONSTRAINT "word_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_history" ADD CONSTRAINT "word_history_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "dictionary_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

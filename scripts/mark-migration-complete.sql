-- Скрипт для пометки миграции как выполненной
-- Используется когда таблицы уже созданы через synchronize

-- Проверяем, существует ли таблица migrations
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'migrations') THEN
        CREATE TABLE "migrations" (
            "id" SERIAL NOT NULL,
            "timestamp" bigint NOT NULL,
            "name" character varying NOT NULL,
            CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Помечаем миграцию как выполненную
INSERT INTO migrations (timestamp, name)
VALUES (1764336931186, 'InitialSchema1764336931186')
ON CONFLICT DO NOTHING;

-- Проверяем результат
SELECT * FROM migrations ORDER BY id DESC;


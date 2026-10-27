-- Migration: Adicionar coluna imagem_url na tabela produtos e políticas para bucket produtos

ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Garantir bucket publico produtos
INSERT INTO storage.buckets (id, name, public)
VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Imagens de produtos são públicas'
  ) THEN
    CREATE POLICY "Imagens de produtos são públicas"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'produtos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Usuários autenticados podem enviar imagens de produtos'
  ) THEN
    CREATE POLICY "Usuários autenticados podem enviar imagens de produtos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'produtos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Usuários autenticados podem atualizar imagens de produtos'
  ) THEN
    CREATE POLICY "Usuários autenticados podem atualizar imagens de produtos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'produtos');
  END IF;
END $$;

import { supabase } from "@/integrations/supabase/client";
import { uploadImagemProdutoServer } from "@/lib/server-upload";

/**
 * Redimensiona e comprime uma imagem no navegador usando Canvas.
 * Garante carregamento instantâneo no Cardápio Digital sem consumir banda excessiva.
 */
export async function otimizarImagem(
  file: File,
  maxDim = 800,
  qualidade = 0.85
): Promise<{ blob: Blob; base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Não foi possível processar a imagem no navegador"));
        }

        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const base64 = canvas.toDataURL(mimeType, qualidade);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, base64, mimeType });
            } else {
              resolve({
                blob: new Blob([base64], { type: mimeType }),
                base64,
                mimeType,
              });
            }
          },
          mimeType,
          qualidade
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Realiza o upload da imagem do produto:
 * 1. Tenta upload client-side via Supabase Storage
 * 2. Se falhar, usa Server Function com service role key
 * 3. Se ambos falharem, usa a base64 otimizada como data URL segura
 */
export async function uploadImagemProdutoArquivo(file: File): Promise<string> {
  const { blob, base64, mimeType } = await otimizarImagem(file, 800, 0.85);

  // 1. Client-side direto
  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `itens/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("produtos")
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: pub } = supabase.storage.from("produtos").getPublicUrl(filePath);
      if (pub?.publicUrl) return pub.publicUrl;
    }
  } catch (err) {
    console.warn("Client storage upload falhou, tentando serverFn...", err);
  }

  // 2. Server function
  try {
    const res = await uploadImagemProdutoServer({
      data: {
        base64Data: base64,
        fileName: file.name,
        mimeType,
      },
    });

    if (res?.success && res.url) {
      return res.url;
    }
  } catch (err) {
    console.warn("ServerFn upload falhou, usando base64 otimizada...", err);
  }

  return base64;
}

/**
 * Utilitários para extrair e limpar URLs de imagem embutidas na descrição como fallback
 */
export function extrairImagemDeDescricao(descricao?: string | null): string | null {
  if (!descricao) return null;
  const match = descricao.match(/<!--img:(.*?)-->/);
  return match ? match[1] : null;
}

export function limparDescricao(descricao?: string | null): string {
  if (!descricao) return "";
  return descricao.replace(/<!--img:.*?-->/g, "").trim();
}

export function embutirImagemNaDescricao(descricao: string, imagemUrl?: string | null): string {
  const limpa = limparDescricao(descricao);
  if (!imagemUrl || !imagemUrl.trim()) return limpa;
  return `${limpa}\n<!--img:${imagemUrl.trim()}-->`.trim();
}

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const uploadImagemProdutoServer = createServerFn({ method: "POST" })
  .validator((data: { base64Data: string; fileName: string; mimeType: string }) => data)
  .handler(async ({ data }) => {
    try {
      const supabaseUrl =
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        "https://pabftlpmwfkttzlfywyi.supabase.co";
      const supabaseServiceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY ||
        "";

      const s = createClient(supabaseUrl, supabaseServiceKey);
      const cleanBase64 = data.base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");
      const ext = (data.fileName.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const filePath = `itens/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error } = await s.storage.from("produtos").upload(filePath, buffer, {
        contentType: data.mimeType || "image/jpeg",
        upsert: true,
      });

      if (error) {
        console.error("Erro storage upload:", error);
        return { success: false, error: error.message };
      }

      const { data: pubData } = s.storage.from("produtos").getPublicUrl(filePath);
      return { success: true, url: pubData.publicUrl };
    } catch (err: any) {
      console.error("Erro no uploadImagemProdutoServer:", err);
      return { success: false, error: err?.message || "Falha no upload do servidor" };
    }
  });

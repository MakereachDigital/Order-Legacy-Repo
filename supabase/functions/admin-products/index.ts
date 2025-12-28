import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ProductCategory = "Cufflinks" | "Ties" | "Other";

const ALLOWED_CATEGORIES = new Set<ProductCategory>(["Cufflinks", "Ties", "Other"]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function safeString(value: unknown, field: string, { required = false, max = 2_000_000 } = {}) {
  if (value === undefined || value === null) {
    if (required) throw new Error(`Missing field: ${field}`);
    return undefined;
  }
  if (typeof value !== "string") throw new Error(`Invalid field type: ${field}`);
  const trimmed = value.trim();
  if (required && trimmed.length === 0) throw new Error(`Empty field: ${field}`);
  if (trimmed.length > max) throw new Error(`Field too long: ${field}`);
  return trimmed;
}

function normalizeCategory(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid category type");
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!ALLOWED_CATEGORIES.has(trimmed as ProductCategory)) {
    throw new Error("Invalid category value");
  }
  return trimmed;
}

function toDbProduct(input: any) {
  const id = safeString(input?.id, "product.id", { required: true, max: 500 });
  const name = safeString(input?.name, "product.name", { required: true, max: 500 });
  const image = safeString(input?.image, "product.image", { required: true });

  const price = safeString(input?.price, "product.price", { required: false, max: 200 }) ?? null;
  const sku = safeString(input?.sku, "product.sku", { required: false, max: 200 }) ?? null;
  const category = normalizeCategory(input?.category);

  return {
    id,
    name,
    image,
    price,
    sku,
    category: category === undefined ? null : category,
  };
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error("[INTERNAL] Missing backend env vars");
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const service = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }

    const action = (body as any).action;
    if (typeof action !== "string") {
      return jsonResponse({ error: "Missing action" }, 400);
    }

    // Always allow authenticated users to query their own permissions
    if (action === "get_permissions") {
      const { data, error } = await service.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (error) {
        console.error("[INTERNAL] get_permissions rpc error:", error);
        return jsonResponse({ error: "Unable to check permissions" }, 500);
      }

      return jsonResponse({ isAdmin: Boolean(data) });
    }

    // All other actions require admin role
    const { data: isAdmin, error: roleError } = await service.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError) {
      console.error("[INTERNAL] has_role rpc error:", roleError);
      return jsonResponse({ error: "Unable to authorize" }, 500);
    }

    if (!isAdmin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    if (action === "insert") {
      const product = toDbProduct((body as any).product);
      const { error } = await service.from("products").insert(product);
      if (error) {
        console.error("[INTERNAL] insert error:", error);
        return jsonResponse({ error: "Unable to save product" }, 500);
      }
      return jsonResponse({ success: true });
    }

    if (action === "bulk_insert") {
      const productsInput = (body as any).products;
      if (!Array.isArray(productsInput) || productsInput.length === 0) {
        return jsonResponse({ error: "No products provided" }, 400);
      }

      const rows = productsInput.map(toDbProduct);
      const { error } = await service.from("products").insert(rows);
      if (error) {
        console.error("[INTERNAL] bulk_insert error:", error);
        return jsonResponse({ error: "Unable to save products" }, 500);
      }
      return jsonResponse({ success: true, count: rows.length });
    }

    if (action === "update") {
      const id = safeString((body as any).id, "id", { required: true, max: 500 });
      const updatesInput = (body as any).updates ?? {};
      if (!updatesInput || typeof updatesInput !== "object") {
        return jsonResponse({ error: "Invalid updates" }, 400);
      }

      const updateData: Record<string, string | null> = {};
      const name = safeString(updatesInput.name, "updates.name", { required: false, max: 500 });
      const image = safeString(updatesInput.image, "updates.image", { required: false });
      const price = safeString(updatesInput.price, "updates.price", { required: false, max: 200 });
      const sku = safeString(updatesInput.sku, "updates.sku", { required: false, max: 200 });
      const category = normalizeCategory(updatesInput.category);

      if (name !== undefined) updateData.name = name;
      if (image !== undefined) updateData.image = image;
      if (price !== undefined) updateData.price = price || null;
      if (sku !== undefined) updateData.sku = sku || null;
      if (category !== undefined) updateData.category = category;

      if (Object.keys(updateData).length === 0) {
        return jsonResponse({ error: "No updates provided" }, 400);
      }

      const { error } = await service.from("products").update(updateData).eq("id", id);
      if (error) {
        console.error("[INTERNAL] update error:", error);
        return jsonResponse({ error: "Unable to update product" }, 500);
      }
      return jsonResponse({ success: true });
    }

    if (action === "bulk_update") {
      const updates = (body as any).updates;
      if (!Array.isArray(updates) || updates.length === 0) {
        return jsonResponse({ error: "No updates provided" }, 400);
      }

      for (const u of updates) {
        const id = safeString(u?.id, "updates[].id", { required: true, max: 500 });
        const updatesInput = u?.updates ?? {};
        if (!updatesInput || typeof updatesInput !== "object") {
          return jsonResponse({ error: "Invalid updates payload" }, 400);
        }

        const updateData: Record<string, string | null> = {};
        const name = safeString(updatesInput.name, "updates[].updates.name", { required: false, max: 500 });
        const price = safeString(updatesInput.price, "updates[].updates.price", { required: false, max: 200 });
        const category = normalizeCategory(updatesInput.category);

        if (name !== undefined) updateData.name = name;
        if (price !== undefined) updateData.price = price || null;
        if (category !== undefined) updateData.category = category;

        if (Object.keys(updateData).length === 0) continue;

        const { error } = await service.from("products").update(updateData).eq("id", id);
        if (error) {
          console.error("[INTERNAL] bulk_update error (id=%s):", id, error);
          return jsonResponse({ error: "Unable to update products" }, 500);
        }
      }

      return jsonResponse({ success: true });
    }

    if (action === "delete") {
      const id = safeString((body as any).id, "id", { required: true, max: 500 });
      const { error } = await service.from("products").delete().eq("id", id);
      if (error) {
        console.error("[INTERNAL] delete error:", error);
        return jsonResponse({ error: "Unable to delete product" }, 500);
      }
      return jsonResponse({ success: true });
    }

    if (action === "bulk_delete") {
      const ids = (body as any).ids;
      if (!Array.isArray(ids) || ids.length === 0 || !ids.every((x: any) => typeof x === "string")) {
        return jsonResponse({ error: "Invalid ids" }, 400);
      }

      const { error } = await service.from("products").delete().in("id", ids);
      if (error) {
        console.error("[INTERNAL] bulk_delete error:", error);
        return jsonResponse({ error: "Unable to delete products" }, 500);
      }
      return jsonResponse({ success: true, count: ids.length });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("[INTERNAL] Unhandled error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

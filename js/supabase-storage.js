/**
 * supabase-storage.js
 * ------------------------------------------------------------------
 * Isolated module for Supabase Storage operations only.
 * Independent from supabase.js (which handles dashboard table reads).
 * Does not create buckets, does not modify database schema.
 * ------------------------------------------------------------------
 */

const SupabaseStorage = (function () {
  "use strict";

  let client = null;

  function getClient() {
    if (client) return client;
    if (typeof supabase === "undefined") {
      throw new Error("Supabase JS SDK not loaded. Check the CDN <script> tag in upload.html.");
    }
    client = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return client;
  }

  function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, "_");
  }

  /**
   * Uploads a single File object to the configured bucket.
   * Path pattern: {timestamp}_{sanitized-original-name}
   * Returns { path, publicUrl }.
   */
  async function uploadFile(file) {
    const db = getClient();
    const path = `${Date.now()}_${sanitizeFileName(file.name)}`;

    const { error } = await db.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      throw new Error(`Upload failed for "${file.name}": ${error.message}`);
    }

    const { data: publicData } = db.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .getPublicUrl(path);

    return { path, publicUrl: publicData ? publicData.publicUrl : null };
  }

  /**
   * Lists files currently in the bucket root, most recent first.
   */
  async function listUploads(limit) {
    const db = getClient();
    const { data, error } = await db.storage
      .from(SUPABASE_CONFIG.storageBucket)
      .list("", { limit: limit || 20, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      throw new Error(`Failed to list uploads: ${error.message}`);
    }

    return (data || [])
      .filter((item) => item.name && !item.name.startsWith(".")) // ignore placeholder objects
      .map((item) => {
        const { data: publicData } = db.storage
          .from(SUPABASE_CONFIG.storageBucket)
          .getPublicUrl(item.name);
        return {
          name: item.name,
          sizeBytes: item.metadata ? item.metadata.size : null,
          createdAt: item.created_at,
          publicUrl: publicData ? publicData.publicUrl : null
        };
      });
  }

  return { uploadFile, listUploads };
})();

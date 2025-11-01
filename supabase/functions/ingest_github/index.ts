// Deno edge function: fetch a README.md and extract [text](url) links
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const mdLink = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const readme = url.searchParams.get("readme"); // e.g. https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md
  if (!readme) return new Response("missing ?readme=", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!   // server-side only
  );

  const res = await fetch(readme);
  if (!res.ok) return new Response("fetch failed", { status: 502 });
  const text = await res.text();

  // Ensure source row exists
  const { data: src } = await supabase.from("sources")
    .select("id").eq("url", readme).limit(1).maybeSingle();
  let source_id = src?.id;
  if (!source_id) {
    const ins = await supabase.from("sources").insert({ kind: "github", url: readme }).select("id").single();
    source_id = ins.data?.id;
  }

  // Parse markdown links and insert postings (dedupe by URL unique index)
  const batch: any[] = [];
  for (const m of text.matchAll(mdLink)) {
    const label = m[1]?.trim() || "";
    const link  = m[2]?.trim() || "";
    if (!link.startsWith("http")) continue;

    // naive guess: company in [label], title maybe also in label
    batch.push({
      source_id,
      site: link.includes("greenhouse.io") ? "greenhouse" :
            link.includes("lever.co")      ? "lever"      :
            link.includes("workday")       ? "workday"    : "other",
      company: label.split("—")[0]?.trim() || null,
      title:   label.split("—")[1]?.trim() || null,
      url: link,
      apply_url: link
    });
  }

  // chunk insert (ignore duplicates)
  let inserted = 0;
  while (batch.length) {
    const chunk = batch.splice(0, 500);
    const { data, error } = await supabase.from("postings").insert(chunk, { ignoreDuplicates: true });
    if (!error) inserted += chunk.length;
  }

  return new Response(JSON.stringify({ 
    success: true, 
    message: `Processed ${inserted} job postings`,
    source_id 
  }), {
    headers: { "Content-Type": "application/json" }
  });
});
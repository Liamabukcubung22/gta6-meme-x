// gta6-meme-x-01 entry: validates the meme post and writes a deterministic report.
// Usage: node main.ts [output-dir]
//   output-dir defaults to $OUTPUT_DIR, else ./output
import { readFileSync, existsSync, mkdirSync, writeFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.argv[2] ?? process.env.OUTPUT_DIR ?? join(ROOT, "output");
const POST_PATH = join(ROOT, "POST.json");
const MEME_PATH = join(ROOT, "meme.png");

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path);
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("meme.png is not a PNG file");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main(): void {
  const report: Record<string, unknown> = {
    competition: "gta6-meme-x-01",
    title: "Me Waiting for GTA 6 — make.fun ghost",
    meme: "meme.png",
  };
  const memeStat = statSync(MEME_PATH);
  const size = pngSize(MEME_PATH);
  report.meme_bytes = memeStat.size;
  report.meme_sha256 = sha256(MEME_PATH);
  report.meme_width = size.width;
  report.meme_height = size.height;

  if (existsSync(POST_PATH)) {
    const post = JSON.parse(readFileSync(POST_PATH, "utf8")) as { url?: unknown };
    const url = typeof post.url === "string" ? post.url : "";
    const m = /^https:\/\/(x\.com|twitter\.com)\/([A-Za-z0-9_]+)\/status\/(\d+)$/.exec(url);
    if (!m) throw new Error("POST.json url is not a valid X post URL");
    report.post_url = url;
    report.post_handle = m[2];
    report.post_id = m[3];
    report.status = "ready";
  } else {
    report.post_url = null;
    report.status = "pending_post";
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "entry.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report));
}

main();

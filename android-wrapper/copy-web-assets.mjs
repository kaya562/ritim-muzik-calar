import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(appDir, "..");
const webDir = join(appDir, "www");
const files = ["index.html", "app.js", "style.css", "manifest.json", "service-worker.js", "icon.svg"];

await mkdir(webDir, { recursive: true });
await Promise.all(files.map((file) => copyFile(join(sourceDir, file), join(webDir, file))));

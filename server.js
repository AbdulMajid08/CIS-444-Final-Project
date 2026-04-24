import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const distDir = path.join(ROOT, "dist");
const distLogin = path.join(distDir, "login", "index.html");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

if (!fs.existsSync(distLogin)) {
  console.error(
    "No Vite build found (expected dist/login/index.html).\n" +
      "  Development: npm run dev\n" +
      "  Production static: npm run build && npm start"
  );
  process.exit(1);
}

app.get("/", (req, res) => {
  res.redirect("/login/index.html");
});

app.use(express.static(distDir));

app.listen(PORT, () => {
  console.log(`Mood Journal at http://localhost:${PORT} (serving dist/)`);
});

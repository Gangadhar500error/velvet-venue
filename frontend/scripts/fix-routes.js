const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx?|jsx?|json|md)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const replacements = [
  // Import path fixes after rename
  [/@\/app\/\(main\)\/coworking\//g, "@/app/(main)/venues/"],
  [/\.\.\/coworking\/\[city\]\/data\/workspaces/g, "./[city]/data/workspaces"],
  [/from ["']\.\.\/\.\.\/coworking\//g, 'from "../../venues/'],
  [/from ["']\.\.\/\.\.\/\.\.\/coworking\//g, 'from "../../../venues/'],

  // Absolute URL paths
  [/https:\/\/www\.velvetvenues\.com\/coworking/g, "https://www.velvetvenues.com/venues"],
  [/https:\/\/www\.velvetvenues\.com\/meeting-room/g, "https://www.velvetvenues.com/venues"],
  [/https:\/\/www\.velvetvenues\.com\/private-office/g, "https://www.velvetvenues.com/venues"],
  [/https:\/\/www\.velvetvenues\.com\/virtual-office/g, "https://www.velvetvenues.com/venues"],
  [/https:\/\/www\.coworkspace\.com/g, "https://www.velvetvenues.com"],

  // Route path strings — city+id patterns first
  [/\/coworking\/\$\{/g, "/venues/${"],
  [/\/meeting-room\/\$\{/g, "/venues/${"],
  [/\/private-office\/\$\{/g, "/venues/${"],
  [/\/virtual-office\/\$\{/g, "/venues/${"],

  // Static route strings in hrefs / pushes
  [/"\/coworking"/g, '"/venues"'],
  [/'\/coworking'/g, "'/venues'"],
  [/`\/coworking`/g, "`/venues`"],
  [/"\/meeting-room"/g, '"/venues?category=banquet"'],
  [/'\/meeting-room'/g, "'/venues?category=banquet'"],
  [/"\/private-office"/g, '"/venues?category=resort"'],
  [/'\/private-office'/g, "'/venues?category=resort'"],
  [/"\/virtual-office"/g, '"/venues?category=farm-house"'],
  [/'\/virtual-office'/g, "'/venues?category=farm-house'"],

  // Template literals with city slug after base
  [/href=\{`\/coworking\//g, "href={`/venues/"],
  [/href=\{`\/meeting-room\//g, "href={`/venues/"],
  [/href=\{`\/private-office\//g, "href={`/venues/"],
  [/href=\{`\/virtual-office\//g, "href={`/venues/"],
  [/href={`\/coworking\//g, "href={`/venues/"],

  // canonical paths
  [/canonical: `\/coworking\//g, "canonical: `/venues/"],
  [/canonical: `\/meeting-room\//g, "canonical: `/venues/"],
  [/canonical: `\/private-office\//g, "canonical: `/venues/"],
  [/canonical: `\/virtual-office\//g, "canonical: `/venues/"],
  [/canonical: `\/coworking\/\$\{/g, "canonical: `/venues/${"],
];

let changedFiles = 0;
for (const file of walk(ROOT)) {
  // Skip admin property-listings type-specific cowork fields content? Still update path refs if any
  let content = fs.readFileSync(file, "utf8");
  const original = content;
  for (const [re, to] of replacements) {
    content = content.replace(re, to);
  }
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log("updated", path.relative(ROOT, file));
  }
}

console.log("Done. Files changed:", changedFiles);

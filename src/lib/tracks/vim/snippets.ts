import { toLines } from "@/lib/vim/generators"

/** Original snippets used to generate challenge rounds. Keep lines short (< 60 chars). */

export const CODE = [
  `
function formatPrice(amount, currency) {
  const rounded = Math.round(amount * 100) / 100;
  const symbol = currency === "EUR" ? "€" : "$";
  return symbol + rounded.toFixed(2);
}

const total = formatPrice(cart.total, user.currency);
console.log("Order total:", total);
`,
  `
type Planet = { name: string; moons: number };

const planets: Planet[] = [
  { name: "Mars", moons: 2 },
  { name: "Jupiter", moons: 95 },
  { name: "Neptune", moons: 16 },
];

const crowded = planets.filter((p) => p.moons > 10);
`,
  `
def read_scores(path):
    scores = []
    with open(path) as handle:
        for line in handle:
            name, value = line.split(",")
            scores.append((name, int(value)))
    return sorted(scores, key=lambda s: s[1])
`,
  `
export async function loadProfile(userId: string) {
  const res = await fetch(\`/api/users/\${userId}\`);
  if (!res.ok) {
    throw new Error("Profile request failed");
  }
  const data = await res.json();
  return { id: data.id, name: data.displayName };
}
`,
  `
func Average(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range values {
		sum += v
	}
	return sum / float64(len(values))
}
`.replace(/\t/g, "    "),
  `
class Timer {
  private started = 0;
  private elapsed = 0;

  start() {
    this.started = Date.now();
  }

  stop() {
    this.elapsed += Date.now() - this.started;
    return this.elapsed;
  }
}
`,
  `
const routes = {
  home: "/",
  about: "/about",
  settings: "/account/settings",
};

function linkTo(name, params = {}) {
  const path = routes[name] ?? routes.home;
  return path + toQuery(params);
}
`,
].map(toLines)

/** Punctuation-heavy lines, good for word vs WORD lessons. */
export const PUNCTUATED = [
  `
const url = new URL(req.url, "http://localhost:3000");
const page = parseInt(url.searchParams.get("page") ?? "1");
res.setHeader("Cache-Control", "max-age=60, public");
logger.info(\`[api] GET \${url.pathname}?page=\${page}\`);
cache.set(user.id + ":" + page, rows.slice(0, 20));
`,
  `
items.map((x) => x.price * x.qty).reduce((a, b) => a + b, 0);
document.querySelector("#app > .header-nav").classList.add("open");
const [first, ...rest] = path.split("/").filter(Boolean);
config.db.host = process.env.DB_HOST || "127.0.0.1:5432";
`,
].map(toLines)

/** Snippets with plenty of brackets for text-object lessons. */
export const BRACKETS = [
  `
function area(shape) {
  if (shape.kind === "circle") {
    return Math.PI * (shape.r * shape.r);
  }
  return shape.w * shape.h;
}
const sizes = [area(a), area(b), area(c)];
`,
  `
const theme = {
  colors: { primary: "#3b82f6", muted: "#64748b" },
  spacing: [0, 4, 8, 16, 32],
};
applyTheme(theme, { dark: prefersDark() });
`,
  `
users.forEach((user) => {
  if (isActive(user.lastSeen)) {
    notify(user.email, { subject: "Welcome back" });
  }
});
const ids = users.map((u) => u.id).slice(0, max(limit, 5));
`,
].map(toLines)

/** Snippets with string literals for quote text-object lessons. */
export const QUOTES = [
  `
const greeting = "Hello there, friend";
const farewell = 'See you tomorrow';
const status = \`online since \${since}\`;
log("info", "user signed in");
headers.set('Content-Type', "application/json");
`,
  `
button.title = "Save your changes";
alert('Something went wrong');
const query = "SELECT name FROM users";
router.push(\`/posts/\${postId}\`);
i18n.t("errors.notFound", { item: 'page' });
`,
].map(toLines)

/** Paragraph-separated prose / code for { } ip ap lessons. */
export const PARAGRAPHS = [
  `
import { db } from "./db";
import { mail } from "./mail";

const users = await db.users.findMany();
const active = users.filter((u) => u.active);

for (const user of active) {
  await mail.send(user.email, "digest");
}

console.log("sent", active.length);
`,
  `
Vim splits text into paragraphs
using blank lines as separators.

Each block of lines here counts
as a single paragraph object,
no matter how many lines it has.

Short paragraphs work too.

The last paragraph ends
at the bottom of the file.
`,
].map(toLines)

/** A long file for scrolling / gg / G / relative jumps. */
export const LONG = [
  toLines(`
// inventory.ts
import { Item, Warehouse } from "./types";

const LOW_STOCK = 5;

export function lowStock(items: Item[]) {
  return items.filter((i) => i.qty < LOW_STOCK);
}

export function totalValue(items: Item[]) {
  let sum = 0;
  for (const item of items) {
    sum += item.qty * item.price;
  }
  return sum;
}

export function restock(item: Item, amount: number) {
  if (amount <= 0) {
    throw new Error("amount must be positive");
  }
  return { ...item, qty: item.qty + amount };
}

export function byWarehouse(items: Item[]) {
  const map = new Map<string, Item[]>();
  for (const item of items) {
    const list = map.get(item.warehouse) ?? [];
    list.push(item);
    map.set(item.warehouse, list);
  }
  return map;
}

export function describe(w: Warehouse) {
  return \`\${w.name} (\${w.city})\`;
}

export const version = "1.4.2";
`),
]

export const DEMO_SHORT = `const answer = 42;
function greet(name) {
  return "Hi, " + name;
}`

/** Replacement identifiers for change-word style challenges. */
export const WORDS = ["value", "result", "count", "items", "total", "config", "buffer", "index", "label", "status"]
export const LINES_TO_ADD = ["return null;", "// TODO: validate input", "debugger;", "retries += 1;", "await flush();"]
export const JUNK_LINES = ['console.log("debug");', "// old code, remove me", "debugger;", 'print("here")', "// FIXME"]

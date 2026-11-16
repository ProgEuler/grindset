/** Dummy files for the free-practice playground. Original code, written to have plenty to edit. */

export interface PlaygroundFile {
  id: string
  name: string
  text: string
}

const trim = (s: string) => s.replace(/^\n/, "").replace(/\s+$/, "")

export const PLAYGROUND_FILES: PlaygroundFile[] = [
  {
    id: "react",
    name: "TodoList.tsx",
    text: trim(`
import { useState } from "react";

type Todo = { id: number; title: string; done: boolean };

export function TodoList({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initial);
  const [draft, setDraft] = useState("");

  function addTodo() {
    if (!draft.trim()) return;
    setTodos([...todos, { id: Date.now(), title: draft, done: false }]);
    setDraft("");
  }

  function toggle(id: number) {
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <section className="todo-list">
      <h2>Todos ({remaining} left)</h2>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((t) => (
          <li key={t.id} onClick={() => toggle(t.id)}>
            {t.done ? "✓ " : ""}{t.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
`),
  },
  {
    id: "api",
    name: "server.js",
    text: trim(`
const express = require("express");
const app = express();

const books = [
  { id: 1, title: "Dune", author: "Frank Herbert", year: 1965 },
  { id: 2, title: "Neuromancer", author: "William Gibson", year: 1984 },
  { id: 3, title: "Hyperion", author: "Dan Simmons", year: 1989 },
];

app.use(express.json());

app.get("/books", (req, res) => {
  const { author } = req.query;
  const result = author ? books.filter((b) => b.author === author) : books;
  res.json(result);
});

app.get("/books/:id", (req, res) => {
  const book = books.find((b) => b.id === Number(req.params.id));
  if (!book) {
    return res.status(404).json({ error: "Book not found" });
  }
  res.json(book);
});

app.post("/books", (req, res) => {
  const book = { id: books.length + 1, ...req.body };
  books.push(book);
  res.status(201).json(book);
});

app.listen(3000, () => console.log("listening on :3000"));
`),
  },
  {
    id: "python",
    name: "inventory.py",
    text: trim(`
import json
from dataclasses import dataclass


@dataclass
class Item:
    name: str
    price: float
    qty: int = 0

    def total(self):
        return self.price * self.qty


def load_items(path):
    with open(path) as f:
        raw = json.load(f)
    return [Item(**row) for row in raw]


def low_stock(items, threshold=5):
    return [i for i in items if i.qty < threshold]


def report(items):
    lines = []
    for item in sorted(items, key=lambda i: i.total(), reverse=True):
        lines.append(f"{item.name:<12} {item.qty:>4} x {item.price:.2f}")
    return "\\n".join(lines)


if __name__ == "__main__":
    items = load_items("items.json")
    print(report(items))
    print("low:", [i.name for i in low_stock(items)])
`),
  },
  {
    id: "go",
    name: "cache.go",
    text: trim(`
package cache

import (
    "sync"
    "time"
)

type entry struct {
    value     string
    expiresAt time.Time
}

type Cache struct {
    mu    sync.Mutex
    items map[string]entry
    ttl   time.Duration
}

func New(ttl time.Duration) *Cache {
    return &Cache{items: make(map[string]entry), ttl: ttl}
}

func (c *Cache) Set(key, value string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.items[key] = entry{value: value, expiresAt: time.Now().Add(c.ttl)}
}

func (c *Cache) Get(key string) (string, bool) {
    c.mu.Lock()
    defer c.mu.Unlock()
    e, ok := c.items[key]
    if !ok || time.Now().After(e.expiresAt) {
        return "", false
    }
    return e.value, true
}
`),
  },
  {
    id: "json",
    name: "config.json",
    text: trim(`
{
  "name": "weather-dashboard",
  "version": "2.3.1",
  "port": 8080,
  "debug": false,
  "cities": ["Lisbon", "Nairobi", "Osaka", "Toronto"],
  "units": {
    "temperature": "celsius",
    "wind": "km/h"
  },
  "refresh": {
    "intervalSeconds": 300,
    "retry": { "attempts": 3, "backoffMs": 500 }
  },
  "features": {
    "alerts": true,
    "radar": false,
    "forecastDays": 7
  }
}
`),
  },
  {
    id: "markdown",
    name: "notes.md",
    text: trim(`
# Release checklist

Before tagging a new version, walk through every step below.
Skipping one is how broken builds reach users.

## Code

- All tests pass on the main branch
- No TODO comments left in changed files
- Version number bumped in package.json

## Docs

- Changelog updated with every user-facing change
- Screenshots refreshed if the UI changed
- Upgrade notes written for breaking changes

## Ship it

1. Create the tag: v2.4.0
2. Push the tag and wait for the release build
3. Announce it in the team channel
`),
  },
]

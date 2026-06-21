import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { init, id } from "@instantdb/admin";
import schema from "../src/instant.schema";
import { SEED_SITES } from "../src/lib/seed-data";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const contents = readFileSync(envPath, "utf8");

  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

const appId = process.env.VITE_INSTANT_APP_ID;
const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!appId || !adminToken) {
  throw new Error(
    "Missing VITE_INSTANT_APP_ID or INSTANT_APP_ADMIN_TOKEN in .env",
  );
}

const db = init({
  appId,
  adminToken,
  schema,
});

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number, hour = 12) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.getTime();
}

type SeedTask = {
  text: string;
  description?: string;
  status: "todo" | "doing" | "done";
  order: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
};

const TEST_TASKS: SeedTask[] = [
  {
    text: "Set up project scaffold",
    status: "done",
    order: 0,
    createdAt: daysAgo(7, 9),
    startedAt: daysAgo(6, 10),
    completedAt: daysAgo(5, 16),
  },
  {
    text: "Add navbar",
    status: "done",
    order: 1,
    createdAt: daysAgo(3, 11),
    startedAt: daysAgo(2, 9),
    completedAt: daysAgo(1, 14),
  },
  {
    text: "Wire up auth",
    status: "done",
    order: 2,
    createdAt: daysAgo(1, 10),
    startedAt: daysAgo(1, 13),
    completedAt: daysAgo(0, 9),
  },
  {
    text: "Fix mobile menu",
    status: "done",
    order: 3,
    createdAt: daysAgo(0, 8),
    startedAt: daysAgo(0, 9),
    completedAt: daysAgo(0, 11),
  },
  {
    text: "Style daily feed cards",
    status: "done",
    order: 4,
    createdAt: daysAgo(4, 10),
    startedAt: daysAgo(3, 15),
    completedAt: daysAgo(3, 18),
  },
  {
    text: "Add drag-and-drop board",
    status: "done",
    order: 5,
    createdAt: daysAgo(2, 9),
    startedAt: daysAgo(1, 11),
    completedAt: daysAgo(1, 17),
  },
  {
    text: "Write seed script",
    status: "done",
    order: 6,
    createdAt: daysAgo(0, 7),
    startedAt: daysAgo(0, 8),
    completedAt: daysAgo(0, 10),
  },
  {
    text: "Polish empty states",
    status: "doing",
    order: 0,
    createdAt: daysAgo(0, 12),
    startedAt: daysAgo(0, 13),
  },
  {
    text: "Add site manager dialog",
    status: "doing",
    order: 1,
    createdAt: daysAgo(1, 16),
    startedAt: daysAgo(0, 14),
  },
  {
    text: "Document deployment steps",
    status: "todo",
    order: 0,
    createdAt: daysAgo(0, 15),
  },
  {
    text: "Add keyboard shortcuts",
    status: "todo",
    order: 1,
    createdAt: daysAgo(0, 16),
  },
  {
    text: "Review public permissions",
    status: "todo",
    order: 2,
    createdAt: daysAgo(0, 17),
  },
];

async function seed() {
  const existing = await db.query({ sites: {} });
  const existingSlugs = new Set(existing.sites.map((site) => site.slug));

  const txs = [];

  for (const [index, site] of SEED_SITES.entries()) {
    if (existingSlugs.has(site.slug)) {
      console.log(`Skipping existing site: ${site.slug}`);
      continue;
    }

    const siteId = id();
    txs.push(
      db.tx.sites[siteId].update({
        name: site.name,
        slug: site.slug,
        description: site.description,
        order: index,
        createdAt: Date.now() - (SEED_SITES.length - index) * DAY_MS,
      }),
    );

    if (site.slug === "test") {
      for (const task of TEST_TASKS) {
        const taskId = id();
        txs.push(
          db.tx.tasks[taskId]
            .update({
              text: task.text,
              description: task.description,
              status: task.status,
              order: task.order,
              createdAt: task.createdAt,
              startedAt: task.startedAt,
              completedAt: task.completedAt,
            })
            .link({ site: siteId }),
        );
      }
    }
  }

  if (txs.length === 0) {
    console.log("Nothing to seed.");
    return;
  }

  await db.transact(txs);
  console.log(`Seeded ${txs.length} operations.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});

import bcrypt from "bcryptjs";
import type { Activity, Product, PublicUser, User } from "@/lib/types";

interface UserRecord extends User {
  passwordHash: string;
}

interface Db {
  users: UserRecord[];
  products: Product[];
  activity: Activity[];
}

/* Deterministic PRNG so the seed is stable between reloads within a run. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260706);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

let counter = 0;
export function uid(prefix: string) {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

/* ---------------------------------------------------------------- */
/* Generated product art: geometric SVG in the system palette.       */
/* ---------------------------------------------------------------- */

const ART_BG = ["#131316", "#1a1a1e", "#0b0b0d"];
const ART_FG = ["#e9e4da", "#ff5c28", "#8a8578"];

export function productArt(seed: number): string {
  const r = mulberry32(seed * 7919 + 17);
  const bg = ART_BG[Math.floor(r() * ART_BG.length)];
  const shapes: string[] = [];
  const kinds = ["circle", "bar", "arc", "tri"] as const;
  const count = 4 + Math.floor(r() * 4);
  for (let i = 0; i < count; i++) {
    const fg = ART_FG[Math.floor(r() * ART_FG.length)];
    const kind = kinds[Math.floor(r() * kinds.length)];
    const x = 40 + r() * 320;
    const y = 40 + r() * 320;
    const s = 20 + r() * 120;
    if (kind === "circle") {
      const filled = r() > 0.5;
      shapes.push(
        `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s / 2).toFixed(0)}" ${
          filled ? `fill="${fg}"` : `fill="none" stroke="${fg}" stroke-width="2"`
        }/>`,
      );
    } else if (kind === "bar") {
      shapes.push(
        `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${(
          6 + r() * 14
        ).toFixed(0)}" fill="${fg}" transform="rotate(${Math.floor(r() * 4) * 45} ${x.toFixed(
          0,
        )} ${y.toFixed(0)})"/>`,
      );
    } else if (kind === "arc") {
      shapes.push(
        `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} a ${(s / 2).toFixed(0)} ${(s / 2).toFixed(
          0,
        )} 0 0 1 ${s.toFixed(0)} 0" fill="none" stroke="${fg}" stroke-width="2"/>`,
      );
    } else {
      shapes.push(
        `<polygon points="${x},${y} ${x + s},${y} ${x + s / 2},${y - s * 0.85}" fill="${fg}" opacity="0.9"/>`,
      );
    }
  }
  const grid =
    `<path d="M 0 200 H 400 M 200 0 V 400" stroke="#232328" stroke-width="1"/>` +
    `<rect x="0.5" y="0.5" width="399" height="399" fill="none" stroke="#232328"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${bg}"/>${grid}${shapes.join(
    "",
  )}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* ---------------------------------------------------------------- */
/* Seed                                                              */
/* ---------------------------------------------------------------- */

const FIRST = [
  "Артём", "Мария", "Иван", "Соня", "Лев", "Дина", "Марк", "Алиса",
  "Тимур", "Вера", "Егор", "Нина", "Павел", "Кира", "Олег", "Ада",
  "Роман", "Юна", "Глеб", "Мира",
];
const LAST = [
  "Волков", "Сато", "Крамер", "Линд", "Морено", "Хартман", "Одзаки",
  "Беккер", "Штерн", "Каменев", "Росси", "Вебер", "Танака", "Норд",
];
const PRODUCT_NAMES: Array<[string, string]> = [
  ["Лампа TILT-04", "Свет"],
  ["Ваза FRACTURE", "Керамика"],
  ["Кресло RIG-2", "Металл"],
  ["Плед RASTER", "Текстиль"],
  ["Плакат GRID/AXIS", "Печать"],
  ["Бра HALFTONE", "Свет"],
  ["Чаша SEAM-11", "Керамика"],
  ["Стеллаж LATTICE", "Металл"],
  ["Ковер PHOSPHOR", "Текстиль"],
  ["Литография ORBIT", "Печать"],
  ["Торшер PYLON", "Свет"],
  ["Кашпо MONO-3", "Керамика"],
  ["Табурет STRUT", "Металл"],
  ["Штора SCRIM", "Текстиль"],
  ["Шелкография VECTOR-9", "Печать"],
  ["Ночник EMBER", "Свет"],
  ["Сервиз KILN SET", "Керамика"],
  ["Вешалка ARMATURE", "Металл"],
  ["Подушка MOIRE", "Текстиль"],
  ["Плакат SIGNAL/27", "Печать"],
];

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function seed(): Db {
  // One shared hash for seeded accounts keeps startup fast (bcrypt is slow).
  const commonHash = bcrypt.hashSync("password123", 8);
  const adminHash = bcrypt.hashSync("admin1234", 8);
  const userHash = bcrypt.hashSync("user1234", 8);

  const users: UserRecord[] = [
    {
      id: "u_admin",
      email: "admin@foundry.dev",
      name: "Ада Штерн",
      role: "admin",
      status: "active",
      avatar: null,
      createdAt: daysAgo(240),
      lastActiveAt: daysAgo(0),
      favorites: [],
      history: [],
      passwordHash: adminHash,
    },
    {
      id: "u_demo",
      email: "user@foundry.dev",
      name: "Марк Волков",
      role: "user",
      status: "active",
      avatar: null,
      createdAt: daysAgo(90),
      lastActiveAt: daysAgo(1),
      favorites: [],
      history: [],
      passwordHash: userHash,
    },
  ];

  for (let i = 0; i < 38; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    const created = Math.floor(rnd() * 300) + 2;
    users.push({
      id: uid("u"),
      email: `${name
        .toLowerCase()
        .replace(/[^a-zа-яё]+/gi, ".")
        .replace(/^\.|\.$/g, "")}${i}@mail.dev`,
      name,
      role: "user",
      status: rnd() > 0.88 ? "blocked" : "active",
      avatar: null,
      createdAt: daysAgo(created),
      lastActiveAt: daysAgo(Math.floor(rnd() * Math.min(created, 30))),
      favorites: [],
      history: [],
      passwordHash: commonHash,
    });
  }

  const products: Product[] = PRODUCT_NAMES.map(([name, category], i) => ({
    id: `p_${i.toString(36)}${Math.floor(rnd() * 1e6).toString(36)}`,
    name,
    category,
    price: Math.round((40 + rnd() * 960) / 5) * 5,
    status: rnd() > 0.85 ? "hidden" : "active",
    description:
      "Объект малой серии. Производится вручную в мастерской FOUNDRY, " +
      "каждый экземпляр нумеруется и сопровождается паспортом изделия. " +
      "Материалы проходят входной контроль, допуски — по внутреннему стандарту F-7.",
    image: productArt(i + 1),
    stock: Math.floor(rnd() * 24),
    views: Math.floor(rnd() * 900),
    createdAt: daysAgo(Math.floor(rnd() * 200) + 1),
  }));

  const ACTIONS: Array<[string, (p: Product, u: UserRecord) => string]> = [
    ["создал заказ на", (p) => p.name],
    ["добавил в избранное", (p) => p.name],
    ["просмотрел", (p) => p.name],
    ["обновил профиль", () => "—"],
    ["вошёл в систему", () => "—"],
  ];
  const activity: Activity[] = [];
  for (let i = 0; i < 26; i++) {
    const u = pick(users);
    const [action, targetOf] = pick(ACTIONS);
    activity.push({
      id: uid("a"),
      actor: u.name,
      action,
      target: targetOf(pick(products), u),
      at: new Date(Date.now() - i * 47 * 60000 - rnd() * 30 * 60000).toISOString(),
    });
  }

  return { users, products, activity };
}

/* Survives HMR in dev via globalThis; resets on server restart (demo store). */
const globalDb = globalThis as unknown as { __foundryDb?: Db };

export function db(): Db {
  if (!globalDb.__foundryDb) globalDb.__foundryDb = seed();
  return globalDb.__foundryDb;
}

export function logActivity(actor: string, action: string, target: string) {
  db().activity.unshift({
    id: uid("a"),
    actor,
    action,
    target,
    at: new Date().toISOString(),
  });
  db().activity = db().activity.slice(0, 120);
}

export function toPublicUser(u: UserRecord): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status,
    avatar: u.avatar,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
  };
}

export type { UserRecord };

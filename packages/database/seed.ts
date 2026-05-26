import "dotenv/config";
import bcrypt from "bcryptjs";
import db, { users, forms, fields, responses, themes, formViews } from "./index";
import { eq } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const past = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickMultiple<T>(arr: T[], min = 1, max = 3): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── 10 Preset Themes ─────────────────────────────────────────────────────────

const PRESET_THEMES = [
  {
    name: "Midnight Tokyo",
    slug: "midnight-tokyo",
    category: "anime",
    config: {
      bgColor: "#0d0d1a",
      primaryColor: "#7c3aed",
      textColor: "#e2e8f0",
      accentColor: "#a78bfa",
      borderRadius: 12,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Arc Reactor",
    slug: "arc-reactor",
    category: "tech",
    config: {
      bgColor: "#0a1628",
      primaryColor: "#00d4ff",
      textColor: "#cce7ff",
      accentColor: "#7dd3fc",
      borderRadius: 8,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Y Combinator",
    slug: "y-combinator",
    category: "tech",
    config: {
      bgColor: "#ffffff",
      primaryColor: "#ff6600",
      textColor: "#1a1a1a",
      accentColor: "#6b7280",
      borderRadius: 6,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: true,
  },
  {
    name: "Blade Runner",
    slug: "blade-runner",
    category: "movies",
    config: {
      bgColor: "#0a0a0f",
      primaryColor: "#ff4d6d",
      textColor: "#f0e6d3",
      accentColor: "#fbbf24",
      borderRadius: 4,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "outline",
    },
    isDefault: false,
  },
  {
    name: "Doom Eternal",
    slug: "doom-eternal",
    category: "games",
    config: {
      bgColor: "#1a0000",
      primaryColor: "#cc0000",
      textColor: "#ffcccc",
      accentColor: "#fca5a5",
      borderRadius: 2,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Cotton Candy",
    slug: "cotton-candy",
    category: "minimal",
    config: {
      bgColor: "#fdf2f8",
      primaryColor: "#ec4899",
      textColor: "#831843",
      accentColor: "#be185d",
      borderRadius: 16,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Forest",
    slug: "forest",
    category: "minimal",
    config: {
      bgColor: "#f0fdf4",
      primaryColor: "#16a34a",
      textColor: "#14532d",
      accentColor: "#166534",
      borderRadius: 10,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Ocean Depths",
    slug: "ocean-depths",
    category: "minimal",
    config: {
      bgColor: "#eff6ff",
      primaryColor: "#2563eb",
      textColor: "#1e3a5f",
      accentColor: "#3b82f6",
      borderRadius: 10,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Sunset",
    slug: "sunset",
    category: "minimal",
    config: {
      bgColor: "#fff7ed",
      primaryColor: "#ea580c",
      textColor: "#431407",
      accentColor: "#9a3412",
      borderRadius: 12,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "filled",
    },
    isDefault: false,
  },
  {
    name: "Monochrome",
    slug: "monochrome",
    category: "minimal",
    config: {
      bgColor: "#fafafa",
      primaryColor: "#18181b",
      textColor: "#18181b",
      accentColor: "#71717a",
      borderRadius: 4,
      fontFamily: "Inter, sans-serif",
      buttonStyle: "outline",
    },
    isDefault: false,
  },
];

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding FormForge database…");

  // ── 1. Upsert themes ───────────────────────────────────────────────────────
  console.log("  Seeding themes…");
  for (const t of PRESET_THEMES) {
    const existing = await db.select().from(themes).where(eq(themes.slug, t.slug));
    if (existing.length === 0) {
      await db.insert(themes).values(t);
    } else {
      await db.update(themes).set({ config: t.config, name: t.name, category: t.category }).where(eq(themes.slug, t.slug));
    }
  }

  // ── 2. Demo user ───────────────────────────────────────────────────────────
  console.log("  Seeding demo user…");
  const hashedPassword = await bcrypt.hash("Demo@1234", 10);
  const existingUser = await db.select().from(users).where(eq(users.email, "demo@formforge.dev"));
  let userId: string;
  if (existingUser.length > 0) {
    userId = existingUser[0]!.id;
    console.log("    Demo user already exists, using existing id");
  } else {
    const insertedUsers = await db
      .insert(users)
      .values({ name: "Arjun Mehta", email: "demo@formforge.dev", password: hashedPassword })
      .returning();
    userId = insertedUsers[0]!.id;
  }

  // ── 3. Helper: create form + fields ───────────────────────────────────────
  async function createForm(formDef: {
    title: string;
    slug: string;
    visibility: string;
    isPublished: boolean;
    themeSlug: string;
    description?: string;
    fieldDefs: Array<{
      type: string;
      label: string;
      required: boolean;
      options?: Array<{ label: string; value: string }>;
      validations?: Record<string, unknown>;
    }>;
  }) {
    // Delete old if exists
    const existing = await db.select().from(forms).where(eq(forms.slug, formDef.slug));
    if (existing.length > 0) {
      await db.delete(forms).where(eq(forms.slug, formDef.slug));
    }

    const themeConfig = PRESET_THEMES.find((t) => t.slug === formDef.themeSlug)?.config ?? {};
    const inserted = await db
      .insert(forms)
      .values({
        title: formDef.title,
        slug: formDef.slug,
        description: formDef.description ?? null,
        userId,
        isPublished: formDef.isPublished,
        visibility: formDef.visibility,
        theme: themeConfig,
        settings: { submitButtonText: "Submit", successMessage: "Thank you for your response!" },
      })
      .returning();
    const form = inserted[0]!;

    // Insert fields
    const insertedFields = [];
    for (let i = 0; i < formDef.fieldDefs.length; i++) {
      const fd = formDef.fieldDefs[i]!;
      const fInserted = await db
        .insert(fields)
        .values({
          formId: form.id,
          type: fd.type,
          label: fd.label,
          required: fd.required,
          order: i,
          options: fd.options ?? null,
          validations: fd.validations ?? null,
        })
        .returning();
      insertedFields.push(fInserted[0]!);
    }

    return { form, fields: insertedFields };
  }

  // ── 4. Form 1: Anime Character Alignment Survey ───────────────────────────
  console.log("  Creating Form 1: Anime Alignment Survey…");
  const { form: form1, fields: fields1 } = await createForm({
    title: "Anime Character Alignment Survey",
    slug: "anime-alignment-survey",
    visibility: "public",
    isPublished: true,
    themeSlug: "midnight-tokyo",
    description: "Find out where you stand in the anime multiverse.",
    fieldDefs: [
      { type: "short_text", label: "Your anime alias", required: true },
      { type: "email", label: "Your email for results", required: false },
      {
        type: "single_select",
        label: "Which anime era resonates most?",
        required: true,
        options: [
          { label: "90s classics", value: "90s_classics" },
          { label: "2000s peak", value: "2000s_peak" },
          { label: "2010s golden age", value: "2010s_golden" },
          { label: "2020s now", value: "2020s_now" },
        ],
      },
      {
        type: "rating",
        label: "Rate your anime obsession (1–10)",
        required: true,
        validations: { max: 10 },
      },
      {
        type: "multi_select",
        label: "Favorite genres",
        required: true,
        options: [
          { label: "Shonen", value: "shonen" },
          { label: "Seinen", value: "seinen" },
          { label: "Isekai", value: "isekai" },
          { label: "Mecha", value: "mecha" },
          { label: "Slice of Life", value: "slice_of_life" },
          { label: "Horror", value: "horror" },
        ],
      },
      { type: "long_text", label: "Describe your all-time favorite arc", required: false },
    ],
  });

  // Seed 47 responses for form 1
  const aliases = [
    "NeonSamurai",
    "SakuraBlade",
    "GundamPilot",
    "AttackTitan",
    "DragonSlayer",
    "LightYagami",
    "NarutoFan",
    "OnePieceLover",
    "FMABrother",
    "HunterHunter",
  ];
  const eras = ["90s_classics", "2000s_peak", "2010s_golden", "2020s_now"];
  const genres = ["shonen", "seinen", "isekai", "mecha", "slice_of_life", "horror"];
  const arcs = [
    "The Chimera Ant arc is peak fiction.",
    "Marineford will never be topped.",
    "Pain's invasion arc broke me.",
    "Chunin Exams is childhood.",
    "The Promised Neverland Season 1.",
  ];

  for (let i = 0; i < 47; i++) {
    const fieldMap: Record<string, unknown> = {};
    fieldMap[fields1[0]!.id] = pick(aliases) + Math.floor(Math.random() * 999);
    const indianEmails = ["sneha.mehta","riya.sharma","rohan.verma","ananya.singh","rahul.gupta","kavita.patel","vikram.nair","arjun.reddy","aditya.kumar","nidhi.joshi"];
    if (Math.random() > 0.6) fieldMap[fields1[1]!.id] = `${indianEmails[i % indianEmails.length]}@gmail.com`;
    fieldMap[fields1[2]!.id] = pick(eras);
    fieldMap[fields1[3]!.id] = 1 + Math.floor(Math.random() * 10);
    fieldMap[fields1[4]!.id] = pickMultiple(genres, 1, 4);
    if (Math.random() > 0.5) fieldMap[fields1[5]!.id] = pick(arcs);
    await db.insert(responses).values({
      formId: form1.id,
      answers: fieldMap,
      completionTime: 30 + Math.floor(Math.random() * 180),
      respondentEmail: fieldMap[fields1[1]!.id] as string | undefined,
      createdAt: randomDate(30),
    });
  }

  // ── 5. Form 2: Dev Tool Satisfaction Survey ────────────────────────────────
  console.log("  Creating Form 2: Dev Tools Survey…");
  const { form: form2, fields: fields2 } = await createForm({
    title: "Dev Tool Satisfaction Survey",
    slug: "dev-tools-2025",
    visibility: "public",
    isPublished: true,
    themeSlug: "arc-reactor",
    description: "Help us understand the modern developer toolchain.",
    fieldDefs: [
      { type: "short_text", label: "Your role", required: true },
      {
        type: "single_select",
        label: "Primary language",
        required: true,
        options: [
          { label: "TypeScript", value: "typescript" },
          { label: "Python", value: "python" },
          { label: "Go", value: "go" },
          { label: "Rust", value: "rust" },
          { label: "Java", value: "java" },
          { label: "Other", value: "other" },
        ],
      },
      {
        type: "rating",
        label: "Rate your current IDE (1–5)",
        required: true,
        validations: { max: 5 },
      },
      {
        type: "multi_select",
        label: "Tools you use daily",
        required: true,
        options: [
          { label: "VS Code", value: "vscode" },
          { label: "Neovim", value: "neovim" },
          { label: "GitHub Copilot", value: "copilot" },
          { label: "Docker", value: "docker" },
          { label: "k8s", value: "k8s" },
          { label: "Linear", value: "linear" },
          { label: "Notion", value: "notion" },
        ],
      },
      { type: "checkbox", label: "I would recommend my stack to a friend", required: false },
      { type: "long_text", label: "Biggest dev frustration in 2025?", required: false },
    ],
  });

  const roles = [
    "Frontend Dev",
    "Backend Dev",
    "Full-Stack",
    "DevOps",
    "ML Engineer",
    "Staff Engineer",
  ];
  const langs = ["typescript", "python", "go", "rust", "java", "other"];
  const tools = ["vscode", "neovim", "copilot", "docker", "k8s", "linear", "notion"];
  const frustrations = [
    "Dependency hell never ends.",
    "TypeScript type errors in edge cases.",
    "k8s YAML is too verbose.",
    "LLMs hallucinate too much.",
    "npm audit always screaming.",
  ];

  for (let i = 0; i < 83; i++) {
    const fieldMap: Record<string, unknown> = {};
    fieldMap[fields2[0]!.id] = pick(roles);
    fieldMap[fields2[1]!.id] = pick(langs);
    fieldMap[fields2[2]!.id] = 1 + Math.floor(Math.random() * 5);
    fieldMap[fields2[3]!.id] = pickMultiple(tools, 2, 5);
    fieldMap[fields2[4]!.id] = Math.random() > 0.3;
    if (Math.random() > 0.4) fieldMap[fields2[5]!.id] = pick(frustrations);
    await db.insert(responses).values({
      formId: form2.id,
      answers: fieldMap,
      completionTime: 20 + Math.floor(Math.random() * 120),
      createdAt: randomDate(30),
    });
  }

  // ── 6. Form 3: Indie Startup Idea Validator ────────────────────────────────
  console.log("  Creating Form 3: Startup Validator…");
  const { form: form3, fields: fields3 } = await createForm({
    title: "Indie Startup Idea Validator",
    slug: "startup-validator",
    visibility: "public",
    isPublished: true,
    themeSlug: "y-combinator",
    description: "Validate your startup idea with the community.",
    fieldDefs: [
      { type: "short_text", label: "Startup name or concept", required: true },
      {
        type: "long_text",
        label: "What problem does it solve?",
        required: true,
        validations: { minLength: 50 },
      },
      {
        type: "single_select",
        label: "Target market size",
        required: true,
        options: [
          { label: "Niche (<10k)", value: "niche" },
          { label: "Small (10k-100k)", value: "small" },
          { label: "Medium (100k-1M)", value: "medium" },
          { label: "Large (>1M)", value: "large" },
        ],
      },
      { type: "number", label: "Estimated MRR goal ($)", required: false, validations: { min: 0 } },
      {
        type: "rating",
        label: "How convinced are you? (1–5)",
        required: true,
        validations: { max: 5 },
      },
      { type: "email", label: "Your email for follow-up", required: false },
    ],
  });

  const startupNames = [
    "FormAI",
    "SlackKiller",
    "Linear for Designers",
    "Notion + Figma",
    "Zero-Click Analytics",
  ];
  const problems = [
    "Most form builders are either too simple or too expensive for indie hackers. There is no middle ground.",
    "Analytics tools collect data but don't help you act on it. This solves the last mile problem.",
    "Teams waste 2 hours daily in meeting scheduling. This eliminates that friction completely.",
    "Developers can't easily share APIs with non-technical stakeholders without custom docs.",
    "Small businesses lose customers because checkout flows are too complex and not mobile-first.",
  ];
  const markets = ["niche", "small", "medium", "large"];

  for (let i = 0; i < 31; i++) {
    const fieldMap: Record<string, unknown> = {};
    fieldMap[fields3[0]!.id] = pick(startupNames) + " v" + (i + 1);
    fieldMap[fields3[1]!.id] = pick(problems);
    fieldMap[fields3[2]!.id] = pick(markets);
    if (Math.random() > 0.4) fieldMap[fields3[3]!.id] = 1000 + Math.floor(Math.random() * 50000);
    fieldMap[fields3[4]!.id] = 1 + Math.floor(Math.random() * 5);
    const founderEmails = ["sneha","riya","rohan","ananya","rahul","kavita","vikram","arjun","aditya","nidhi"];
    if (Math.random() > 0.5) fieldMap[fields3[5]!.id] = `${founderEmails[i % founderEmails.length]}@startup.in`;
    await db.insert(responses).values({
      formId: form3.id,
      answers: fieldMap,
      completionTime: 60 + Math.floor(Math.random() * 240),
      respondentEmail: fieldMap[fields3[5]!.id] as string | undefined,
      createdAt: randomDate(30),
    });
  }

  // ── 7. Form 4: Blade Runner Fan Quiz (UNLISTED) ────────────────────────────
  console.log("  Creating Form 4: Blade Runner Quiz (unlisted)…");
  const { form: form4, fields: fields4 } = await createForm({
    title: "Blade Runner Fan Quiz",
    slug: "blade-runner-quiz",
    visibility: "unlisted",
    isPublished: true,
    themeSlug: "blade-runner",
    description: "Are you human or replicant? Take the Voigt-Kampff test.",
    fieldDefs: [
      { type: "short_text", label: "Your replicant designation", required: true },
      {
        type: "single_select",
        label: "Are you a replicant?",
        required: true,
        options: [
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
          { label: "I don't know", value: "unknown" },
          { label: "Does it matter?", value: "philosophical" },
        ],
      },
      {
        type: "rating",
        label: "Rate Blade Runner 2049 (1–10)",
        required: true,
        validations: { max: 10 },
      },
      { type: "long_text", label: "Your favorite monologue or quote", required: false },
      { type: "email", label: "Email for the Voigt-Kampff results", required: false },
    ],
  });

  const designations = ["N6-ROY", "K-KD6-3.7", "RACHAEL-X", "PRIS-N6", "LEON-N6"];
  const replicantAnswers = ["yes", "no", "unknown", "philosophical"];
  const quotes = [
    "All those moments will be lost in time, like tears in rain.",
    "More human than human is our motto.",
    "I've seen things you people wouldn't believe.",
    "Can the maker repair what he makes?",
  ];

  for (let i = 0; i < 19; i++) {
    const fieldMap: Record<string, unknown> = {};
    fieldMap[fields4[0]!.id] = pick(designations) + "-" + Math.floor(Math.random() * 99);
    fieldMap[fields4[1]!.id] = pick(replicantAnswers);
    fieldMap[fields4[2]!.id] = 7 + Math.floor(Math.random() * 4);
    if (Math.random() > 0.3) fieldMap[fields4[3]!.id] = pick(quotes);
    const bladeRunnerEmails = ["sneha","riya","rohan","ananya","rahul","kavita","vikram","arjun","aditya","nidhi"];
    if (Math.random() > 0.6) fieldMap[fields4[4]!.id] = `${bladeRunnerEmails[i % bladeRunnerEmails.length]}${i}@tyrellcorp.net`;
    await db.insert(responses).values({
      formId: form4.id,
      answers: fieldMap,
      completionTime: 25 + Math.floor(Math.random() * 90),
      createdAt: randomDate(30),
    });
  }

  // ── 8. Form 5: Doom Eternal Loadout Builder (UNLISTED) ────────────────────
  console.log("  Creating Form 5: Doom Eternal Loadout (unlisted)…");
  const { form: form5, fields: fields5 } = await createForm({
    title: "Doom Eternal Loadout Builder",
    slug: "doom-eternal-loadout",
    visibility: "unlisted",
    isPublished: true,
    themeSlug: "doom-eternal",
    description: "Build your ultimate Doom Slayer loadout.",
    fieldDefs: [
      { type: "short_text", label: "Slayer codename", required: true },
      {
        type: "multi_select",
        label: "Preferred weapons",
        required: true,
        options: [
          { label: "Super Shotgun", value: "super_shotgun" },
          { label: "BFG 9000", value: "bfg_9000" },
          { label: "Ballista", value: "ballista" },
          { label: "Rocket Launcher", value: "rocket_launcher" },
          { label: "Plasma Rifle", value: "plasma_rifle" },
        ],
      },
      { type: "rating", label: "Skill level (1–10)", required: true, validations: { max: 10 } },
      {
        type: "single_select",
        label: "Favorite demon to rip and tear",
        required: true,
        options: [
          { label: "Marauder", value: "marauder" },
          { label: "Cyber-Demon", value: "cyber_demon" },
          { label: "Icon of Sin", value: "icon_of_sin" },
          { label: "Imp (classic)", value: "imp" },
        ],
      },
      { type: "checkbox", label: "I have completed Ultra-Nightmare", required: false },
    ],
  });

  const slayerNames = ["DoomSlayer", "InfernoKing", "RipAndTear", "DemonKrusher", "BFGSpammer"];
  const weapons = ["super_shotgun", "bfg_9000", "ballista", "rocket_launcher", "plasma_rifle"];
  const demons = ["marauder", "cyber_demon", "icon_of_sin", "imp"];

  for (let i = 0; i < 12; i++) {
    const fieldMap: Record<string, unknown> = {};
    fieldMap[fields5[0]!.id] = pick(slayerNames) + i;
    fieldMap[fields5[1]!.id] = pickMultiple(weapons, 2, 4);
    fieldMap[fields5[2]!.id] = 5 + Math.floor(Math.random() * 6);
    fieldMap[fields5[3]!.id] = pick(demons);
    fieldMap[fields5[4]!.id] = Math.random() > 0.8;
    await db.insert(responses).values({
      formId: form5.id,
      answers: fieldMap,
      completionTime: 15 + Math.floor(Math.random() * 60),
      createdAt: randomDate(30),
    });
  }

  // ── 9. Seed form_views ─────────────────────────────────────────────────────
  console.log("  Seeding form views…");
  const referrers = [
    "https://reddit.com/r/anime",
    "https://twitter.com",
    "https://github.com",
    "direct",
    "https://hn.algolia.com",
  ];

  async function seedViews(formId: string, count: number) {
    const batch = [];
    for (let i = 0; i < count; i++) {
      batch.push({
        formId,
        ipHash: `hash_${Math.floor(Math.random() * 1000)}`,
        referrer: Math.random() > 0.3 ? pick(referrers) : null,
        createdAt: randomDate(30),
      });
    }
    // Insert in batches of 50
    for (let i = 0; i < batch.length; i += 50) {
      await db.insert(formViews).values(batch.slice(i, i + 50));
    }
  }

  await seedViews(form1.id, 310);
  await seedViews(form2.id, 470);
  await seedViews(form3.id, 190);

  console.log("\n✅ Seed complete!");
  console.log("   Demo user: demo@formforge.dev / Demo@1234");
  console.log("   Forms seeded: 5");
  console.log("     - anime-alignment-survey (public, 47 responses, ~310 views)");
  console.log("     - dev-tools-2025 (public, 83 responses, ~470 views)");
  console.log("     - startup-validator (public, 31 responses, ~190 views)");
  console.log("     - blade-runner-quiz (unlisted, 19 responses)");
  console.log("     - doom-eternal-loadout (unlisted, 12 responses)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

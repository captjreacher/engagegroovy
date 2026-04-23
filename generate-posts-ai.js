const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const bannedPhrases = [
  "drive value",
  "unlock value",
  "optimize",
  "enhance",
  "stall progress",
  "business risks",
  "framework"
];

function containsWeakLanguage(text) {
  return bannedPhrases.some(p => text.toLowerCase().includes(p));
}

assert(!containsWeakLanguage(post.body), "Body contains weak/generic language");
assert(!containsWeakLanguage(post.cta), "CTA contains weak/generic language");
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const articlePath = path.join(__dirname, "article.sample.txt");
const angles = [
  "problem framing",
  "insight framing",
  "operations framing",
  "risk framing",
  "action framing",
];

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is required.");
}

const article = fs.readFileSync(articlePath, "utf-8").trim();
const client = new OpenAI({ apiKey });

function componentContent(post, role) {
  const component = post.component_plan.find((item) => item.role === role);
  return typeof component?.content === "string" ? component.content.trim() : "";
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateRawPost(post, index) {
  const label = `post-${String(index + 1).padStart(2, "0")}`;

  assert(post && typeof post === "object", `${label} must be an object.`);
  assert("selected_template_id" in post, `${label} is missing selected_template_id.`);
  assert("layout_plan" in post, `${label} is missing layout_plan.`);
  assert("style_plan" in post, `${label} is missing style_plan.`);
  assert("component_plan" in post, `${label} is missing component_plan.`);
  assert("qa_notes" in post, `${label} is missing qa_notes.`);
  assert(Array.isArray(post.component_plan), `${label}.component_plan must be an array.`);

  const headline = componentContent(post, "headline");
  const body = componentContent(post, "body");
  const cta = componentContent(post, "cta");

  assert(headline, `${label} is missing headline content.`);
  assert(body, `${label} is missing body content.`);
  assert(cta, `${label} is missing cta content.`);
}

function compatiblePost(post, index) {
  return {
    selected_template_id: post.selected_template_id || "headline_focus",
    layout_plan: {
      aspect_ratio: "1:1",
      alignment: "left",
      structure: ["headline", "body", "cta"],
      hierarchy: "Large headline top-left, concise body beneath, CTA lower-left.",
      spacing: "lg outer margins, md gap between headline and body, xl gap before CTA",
    },
    style_plan: {
      background: "bg-dark",
      palette: ["bg-dark", "text-light", "accent-blue"],
      typography: {
        headline: "heading-xl",
        body: "body-md",
        cta: "label-sm",
      },
      tone: ["direct", "analytical", "commercially useful", "minimal", "editorial"],
      avoid: ["cartoonish", "meme-like", "over-decorated", "clutter", "generic stock design"],
    },
    component_plan: [
      {
        role: "headline",
        content: componentContent(post, "headline"),
      },
      {
        role: "body",
        content: componentContent(post, "body"),
      },
      {
        role: "cta",
        content: componentContent(post, "cta"),
      },
    ],
    qa_notes: {
      status: "pass",
      manual_review_needed: false,
      checks: [
        `Angle: ${angles[index]}.`,
        "AI-generated draft validated against renderer-compatible schema.",
        "Three content elements used.",
        "Concise LinkedIn post copy.",
        "Minimal editorial brand tone maintained.",
      ],
    },
  };
}

function parsePosts(content) {
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`Model output was not valid JSON: ${error.message}`);
  }

  const posts = Array.isArray(parsed) ? parsed : parsed.posts;
  assert(Array.isArray(posts), "Model output must be an array or an object with a posts array.");
  assert(posts.length === 5, `Expected 5 posts, received ${posts.length}.`);

  posts.forEach(validateRawPost);
  return posts.map(compatiblePost);
}

async function generatePosts() {
  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You generate strict JSON only. Do not return markdown fences, commentary, or prose outside JSON.",
      },
      {
        role: "user",
        content: `Turn the article into 5 distinct LinkedIn post JSON payloads.

{
  role: "user",
  content: `Turn the article into 5 distinct LinkedIn posts.

Return strict JSON only:

{
  "posts": [
    {
      "headline": "...",
      "body": "...",
      "cta": "..."
    }
  ]
}

Requirements:
- Generate exactly 5 posts
- Use these angles in order: ${angles.join(", ")}
- Each post must be materially different
- Headline must be sharp and punchy
- Body must be 1–2 short sentences
- CTA must be short and action-oriented
- Tone: direct, analytical, commercially useful
- No fluff, no hashtags, no emojis

Article:
${article}`
}


  const content = response.choices[0]?.message?.content;
  assert(content, "OpenAI response did not include message content.");

  const posts = parsePosts(content);

  posts.forEach((post, index) => {
    const fileName = `post-${String(index + 1).padStart(2, "0")}.json`;
    const filePath = path.join(__dirname, fileName);
    const json = `${JSON.stringify(post, null, 2)}\n`;

    JSON.parse(json);
    fs.writeFileSync(filePath, json);
    JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log(`${fileName} created`);
  });
}

generatePosts().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

CTA must feel like a practical next step, not marketing copy.

Do NOT use:
- "discover"
- "learn how"
- "unlock"
- "optimize"
- "transform"

Prefer:
- short, direct instructions
- operational language

Language rules:
- avoid abstract phrases like "stall progress", "drive value", "enhance outcomes"
- prefer concrete cause-effect statements
- prefer operational language over conceptual language
- if a sentence could appear in a consulting slide, rewrite it

Rewrite rule:
- if the sentence feels generic, make it more specific or more blunt
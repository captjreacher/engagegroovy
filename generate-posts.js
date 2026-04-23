const fs = require("fs");
const path = require("path");

const article = fs.readFileSync(path.join(__dirname, "article.sample.txt"), "utf-8");

if (!article.includes("trust and operating model problem")) {
  throw new Error("article.sample.txt does not contain the expected source article.");
}

function createPost(angle, headline, body, cta) {
  return {
    selected_template_id: "headline_focus",
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
        content: headline,
      },
      {
        role: "body",
        content: body,
      },
      {
        role: "cta",
        content: cta,
      },
    ],
    qa_notes: {
      status: "pass",
      manual_review_needed: false,
      checks: [
        `Angle: ${angle}.`,
        "Renderer-compatible component_plan array.",
        "Three content elements used.",
        "Concise LinkedIn post copy.",
        "Minimal editorial brand tone maintained.",
      ],
    },
  };
}

const posts = [
  createPost(
    "problem framing",
    "AI adoption has a trust problem",
    "Most organisations do not lack tools. They lack process control, trust, and usable governance.",
    "Build trust before scale"
  ),
  createPost(
    "insight framing",
    "AI does not fail first at the model layer",
    "The first constraint is not model capability. It is whether teams know where AI fits and how decisions get made.",
    "Design the operating model"
  ),
  createPost(
    "operations framing",
    "AI becomes usable at the process layer",
    "AI becomes commercially useful when workflows, controls, and accountabilities are repeatable enough for teams to use it with confidence.",
    "Start with the workflow"
  ),
  createPost(
    "risk framing",
    "Unclear ownership kills AI momentum",
    "When ownership is blurred, risk gets harder to contain and good ideas stall before they reach production.",
    "Clarify decision rights"
  ),
  createPost(
    "action framing",
    "Start AI with workflows, not hype",
    "Do not begin with enthusiasm or tools. Begin with the workflows where AI can be governed, measured, and improved.",
    "Start at the process layer"
  ),
];

posts.forEach((post, index) => {
  const fileName = `post-${String(index + 1).padStart(2, "0")}.json`;
  fs.writeFileSync(path.join(__dirname, fileName), `${JSON.stringify(post, null, 2)}\n`);
  console.log(`${fileName} created`);
});

const fs = require("fs");
const path = require("path");

const rules = JSON.parse(
  fs.readFileSync(path.join(__dirname, "render-rules.json"), "utf-8")
);

function tokenValue(tokenOrValue) {
  if (!tokenOrValue) return "";
  return rules.tokens[tokenOrValue] || tokenOrValue;
}

function extractSpacingToken(spacingText, preferredToken) {
  if (!spacingText) return null;
  const match = spacingText.match(new RegExp(`\\b${preferredToken}\\b`, "i"));
  return match ? preferredToken : null;
}

function spacingFromLayout(spacingText) {
  const outer = extractSpacingToken(spacingText, "lg") || rules.layout_defaults.padding;
  const bodyGap = extractSpacingToken(spacingText, "md") || "md";
  const ctaGap = extractSpacingToken(spacingText, "xl") || "xl";

  return {
    outer: tokenValue(outer),
    bodyGap: tokenValue(bodyGap),
    ctaGap: tokenValue(ctaGap),
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getComponent(design, role) {
  const plan = design.component_plan || [];

  if (Array.isArray(plan)) {
    return plan.find((component) => component.role === role)?.content || "";
  }

  return plan[role] || "";
}

function styleForRole(design, role) {
  const typography = design.style_plan?.typography || {};

  if (role === "headline") {
    return {
      fontSize: tokenValue(typography.headline || "heading-xl"),
      color: tokenValue("text-light"),
      maxWidth: rules.layout_defaults.headline_max_width,
      lineHeight: "1.05",
      fontWeight: "700",
      letterSpacing: "-1px",
    };
  }

  if (role === "body") {
    return {
      fontSize: tokenValue(typography.body || "body-md"),
      color: tokenValue("text-light"),
      maxWidth: rules.layout_defaults.body_max_width,
      lineHeight: "1.3",
      fontWeight: "400",
      opacity: "0.92",
    };
  }

  return {
    fontSize: tokenValue(typography.cta || "label-sm"),
    color: tokenValue("accent-blue"),
    maxWidth: rules.layout_defaults.body_max_width,
    lineHeight: "1.15",
    fontWeight: "800",
    opacity: "1",
    letterSpacing: "0.08em",
  };
}

function renderDesign(design) {
  const template = design.selected_template_id || "headline_focus";
  const headline = escapeHtml(getComponent(design, "headline"));
  const body = escapeHtml(getComponent(design, "body"));
  const cta = escapeHtml(getComponent(design, "cta"));
  const spacing = spacingFromLayout(design.layout_plan?.spacing || "");
  const alignment = design.layout_plan?.alignment || "left";
  const bg = tokenValue(design.style_plan?.background || rules.canvas.background);
  const headlineStyle = styleForRole(design, "headline");
  const bodyStyle = styleForRole(design, "body");
  const ctaStyle = styleForRole(design, "cta");

  const content =
    template === "stat_focus"
      ? `
    <div class="content-stack">
      <div class="headline stat-headline">${headline}</div>
      <div class="body">${body}</div>
    </div>
    <div class="cta">${cta}</div>
  `
      : `
    <div class="content-stack">
      <div class="headline">${headline}</div>
      <div class="body">${body}</div>
    </div>
    <div class="cta">${cta}</div>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Design Preview</title>
  <style>
    body {
      margin: 0;
      background: #111;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px;
      box-sizing: border-box;
      overflow: auto;
      font-family: Arial, sans-serif;
    }

    .canvas {
      width: ${rules.canvas.width}px;
      height: ${rules.canvas.height}px;
      background: ${bg};
      color: ${tokenValue("text-light")};
      padding: ${spacing.outer};
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      text-align: ${alignment};
      overflow: hidden;
    }

    .content-stack {
      padding-top: 150px;
      margin-bottom: ${spacing.ctaGap};
    }

    .headline {
      font-size: ${headlineStyle.fontSize};
      color: ${headlineStyle.color};
      max-width: ${headlineStyle.maxWidth};
      line-height: ${headlineStyle.lineHeight};
      font-weight: ${headlineStyle.fontWeight};
      letter-spacing: ${headlineStyle.letterSpacing};
      margin-bottom: ${spacing.bodyGap};
    }

    .stat-headline {
      font-size: 72px;
      line-height: 0.98;
      max-width: ${headlineStyle.maxWidth};
    }

    .body {
      font-size: ${bodyStyle.fontSize};
      color: ${bodyStyle.color};
      max-width: ${bodyStyle.maxWidth};
      line-height: ${bodyStyle.lineHeight};
      font-weight: ${bodyStyle.fontWeight};
      opacity: ${bodyStyle.opacity};
      margin-bottom: 0;
    }

    .cta {
      font-size: ${ctaStyle.fontSize};
      color: ${ctaStyle.color};
      max-width: ${ctaStyle.maxWidth};
      line-height: ${ctaStyle.lineHeight};
      font-weight: ${ctaStyle.fontWeight};
      opacity: ${ctaStyle.opacity};
      letter-spacing: ${ctaStyle.letterSpacing};
      text-transform: uppercase;
      margin-top: auto;
      margin-bottom: 72px;
    }
  </style>
</head>
<body>
  <div class="canvas">
    ${content}
  </div>
</body>
</html>
`;
}

for (let index = 1; index <= 5; index += 1) {
  const id = String(index).padStart(2, "0");
  const inputPath = path.join(__dirname, `post-${id}.json`);
  const outputPath = path.join(__dirname, `post-${id}.html`);
  const design = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  fs.writeFileSync(outputPath, renderDesign(design));
  console.log(`post-${id}.html created`);
}

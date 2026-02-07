// Mermaid.ink API helper for generating diagram images
// Converts Mermaid code to PNG/SVG URLs via mermaid.ink service

/**
 * Makes base64 URL-safe by replacing + with - and / with _
 */
function toUrlSafeBase64(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, ""); // Remove padding
}

/**
 * Generates a PNG image URL from Mermaid code
 * Uses mermaid.ink free API service
 */
export function getMermaidImageUrl(mermaidCode: string): string {
  if (!mermaidCode || mermaidCode.trim() === "") {
    return "";
  }

  try {
    // Clean the mermaid code - remove extra escapes that might be in JSON
    const cleanCode = mermaidCode
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, "  ")
      .trim();

    // URL-safe base64 encode the mermaid code
    const encoded = toUrlSafeBase64(cleanCode);

    // Return the mermaid.ink URL
    return `https://mermaid.ink/img/${encoded}`;
  } catch (err) {
    console.error("Failed to generate mermaid image URL:", err);
    return "";
  }
}

/**
 * Generates an SVG URL from Mermaid code
 * SVG is better for high-quality rendering
 */
export function getMermaidSvgUrl(mermaidCode: string): string {
  if (!mermaidCode || mermaidCode.trim() === "") {
    return "";
  }

  try {
    // Clean the mermaid code
    const cleanCode = mermaidCode
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\t/g, "  ")
      .trim();

    // URL-safe base64 encode the mermaid code
    const encoded = toUrlSafeBase64(cleanCode);

    // Return the mermaid.ink SVG URL
    return `https://mermaid.ink/svg/${encoded}`;
  } catch (err) {
    console.error("Failed to generate mermaid SVG URL:", err);
    return "";
  }
}

/**
 * Validates if mermaid code is likely valid
 * Basic check for common diagram types
 */
export function isValidMermaidCode(code: string): boolean {
  if (!code || code.trim() === "") return false;

  const validStarts = [
    "flowchart",
    "graph",
    "sequenceDiagram",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "journey",
    "gantt",
    "pie",
    "gitGraph",
  ];

  const cleanCode = code.replace(/\\n/g, "\n").trim().toLowerCase();

  return validStarts.some((start) => cleanCode.startsWith(start));
}

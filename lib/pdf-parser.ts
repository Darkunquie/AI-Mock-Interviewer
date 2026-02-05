import pdf from "pdf-parse";

export interface PdfParseResult {
  text: string;
  numPages: number;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);

    // Clean up the extracted text
    let text = data.text;

    // Remove excessive whitespace while preserving line breaks
    text = text
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join("\n");

    return text;
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF file");
  }
}

export async function getPdfMetadata(buffer: Buffer): Promise<PdfParseResult> {
  const data = await pdf(buffer);
  return {
    text: data.text,
    numPages: data.numpages,
  };
}

import { extractText, getDocumentProxy } from "unpdf";

export type PdfPage = { pageNumber: number; text: string };

export type ParsedPdf = {
  pages: PdfPage[];
  totalPages: number;
  totalChars: number;
};

/** Extracts text per page from a PDF buffer. Trims excessive whitespace. */
export async function parsePdf(buffer: Uint8Array): Promise<ParsedPdf> {
  const pdf = await getDocumentProxy(buffer);
  const { text: textArr, totalPages } = await extractText(pdf, {
    mergePages: false,
  });

  const pages: PdfPage[] = (Array.isArray(textArr) ? textArr : [textArr]).map(
    (raw, i) => ({
      pageNumber: i + 1,
      text: cleanPageText(raw ?? ""),
    }),
  );

  const totalChars = pages.reduce((n, p) => n + p.text.length, 0);
  return { pages, totalPages, totalChars };
}

function cleanPageText(s: string): string {
  return s
    .replace(/[   ]/g, " ")
    .replace(/-\n(?=\p{Ll})/gu, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Rough token estimate: 1 token ≈ 3.6 chars for German text. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.6);
}

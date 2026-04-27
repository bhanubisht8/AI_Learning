import express from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * Parses a range string like "1-3, 5, 7-10" into an array of 0-based page indices.
 */
function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || rangeStr.trim() === '') {
    return Array.from({ length: maxPages }, (_, i) => i);
  }

  const indices: Set<number> = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
      if (start && end && !isNaN(start) && !isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(end, maxPages); i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        indices.add(page - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

app.post('/merge', upload.array('files'), async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const ranges = JSON.parse(req.body.ranges || '[]') as string[];

    if (!files || files.length < 2) {
      res.status(400).send('Please upload at least two PDF files.');
      return;
    }

    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;
      
      const pdf = await PDFDocument.load(file.buffer);
      const pageCount = pdf.getPageCount();
      const range = ranges[i] || '';
      
      const indicesToCopy = parsePageRange(range, pageCount);
      
      if (indicesToCopy.length > 0) {
        const copiedPages = await mergedPdf.copyPages(pdf, indicesToCopy);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
    }

    const mergedPdfBytes = await mergedPdf.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(mergedPdfBytes));
  } catch (error) {
    console.error('Error merging PDFs:', error);
    res.status(500).send('An error occurred while merging PDFs.');
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});

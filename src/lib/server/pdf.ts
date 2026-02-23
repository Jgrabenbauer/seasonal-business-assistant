import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type {
  Turnover,
  ChecklistRun,
  ChecklistItemRun,
  Property,
  Organization,
  User,
  WorkOrder,
  ReadinessEvent
} from '@prisma/client';

type TurnoverWithDetails = Turnover & {
  property: Property;
  verifiedBy: User | null;
  workOrder: (WorkOrder & {
    checklistRun:
      | (ChecklistRun & {
          items: (ChecklistItemRun & {
            attachments: { id: string; url: string; filename: string; mimeType: string }[];
          })[];
        })
      | null;
  }) | null;
};

export async function generatePdf(
  turnover: TurnoverWithDetails,
  org: Organization,
  readinessEvents: (ReadinessEvent & { actorName?: string | null })[] = [],
  options: { baseUrl?: string; maxPhotos?: number } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Letter size
  let { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 50;
  let y = height - margin;

  const drawText = (text: string, x: number, yPos: number, size: number, isBold = false) => {
    page.drawText(text, {
      x,
      y: yPos,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0)
    });
  };

  const ensureSpace = (neededHeight: number) => {
    if (y - neededHeight < margin) {
      page = pdfDoc.addPage([612, 792]);
      const size = page.getSize();
      width = size.width;
      height = size.height;
      y = height - margin;
    }
  };

  const drawLine = (yPos: number) => {
    page.drawLine({
      start: { x: margin, y: yPos },
      end: { x: width - margin, y: yPos },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7)
    });
  };

  // Header
  drawText(org.name, margin, y, 20, true);
  y -= 30;
  drawText('Turnover Readiness Certificate', margin, y, 14);
  y -= 20;
  drawLine(y);
  y -= 20;

  // Turnover details
  drawText('Property:', margin, y, 11, true);
  drawText(turnover.property.name, margin + 80, y, 11);
  y -= 18;

  drawText('Title:', margin, y, 11, true);
  drawText(turnover.title, margin + 80, y, 11);
  y -= 18;

  drawText('Status:', margin, y, 11, true);
  drawText(turnover.status, margin + 80, y, 11);
  y -= 18;

  drawText('Guest Arrival:', margin, y, 11, true);
  drawText(turnover.guestArrivalAt.toLocaleString(), margin + 100, y, 11);
  y -= 18;

  drawText('SLA Deadline:', margin, y, 11, true);
  drawText(turnover.slaDeadlineAt.toLocaleString(), margin + 100, y, 11);
  y -= 18;

  const slaStatus =
    turnover.readyAt && turnover.readyAt <= turnover.slaDeadlineAt ? 'On-time' : 'Late';
  drawText('SLA Status:', margin, y, 11, true);
  drawText(slaStatus, margin + 80, y, 11);
  y -= 18;

  drawText('Readiness Score:', margin, y, 11, true);
  drawText(`${turnover.readinessScore}%`, margin + 110, y, 11);
  y -= 18;

  if (turnover.verifiedAt) {
    drawText('Verified:', margin, y, 11, true);
    drawText(turnover.verifiedAt.toLocaleString(), margin + 80, y, 11);
    y -= 18;
  }

  if (turnover.verifiedBy) {
    drawText('Verified By:', margin, y, 11, true);
    drawText(turnover.verifiedBy.name, margin + 80, y, 11);
    y -= 18;
  }

  y -= 10;
  drawLine(y);
  y -= 20;

  // Readiness items
  drawText('Readiness Steps', margin, y, 13, true);
  y -= 20;

  const run = turnover.workOrder?.checklistRun ?? null;
  if (!run || run.items.length === 0) {
    drawText('No readiness steps.', margin, y, 11);
  } else {
    for (const item of run.items) {
      ensureSpace(90);

      const statusIcon =
        item.status === 'COMPLETED' ? '[x]' : item.status === 'SKIPPED' ? '[-]' : '[ ]';
      drawText(`${statusIcon}  ${item.title}`, margin, y, 11, item.status === 'COMPLETED');
      y -= 16;

      if (item.completedAt) {
        drawText(
          `   Completed: ${item.completedAt.toLocaleString()}`,
          margin,
          y,
          9,
          false
        );
        y -= 14;
      }

      if (item.notes) {
        const truncated = item.notes.length > 80 ? item.notes.slice(0, 77) + '...' : item.notes;
        drawText(`   Notes: ${truncated}`, margin, y, 9);
        y -= 14;
      }

      if (item.attachments.length > 0) {
        drawText(`   Photos: ${item.attachments.length}`, margin, y, 9);
        y -= 14;
      }

      y -= 4;
    }
  }

  // Proof photos
  y -= 10;
  drawLine(y);
  y -= 18;
  drawText('Proof Photos', margin, y, 13, true);
  y -= 18;

  const attachments =
    run?.items.flatMap((item) => item.attachments) ?? [];
  const maxPhotos = options.maxPhotos ?? 12;
  const photoAttachments = attachments.slice(0, maxPhotos);

  const resolveUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!options.baseUrl) return null;
    return new URL(url, options.baseUrl).toString();
  };

  const fetchImageBytes = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${url}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  };

  const embedImage = async (bytes: Buffer, mimeType: string) => {
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return pdfDoc.embedJpg(bytes);
    }
    if (mimeType === 'image/png') {
      return pdfDoc.embedPng(bytes);
    }
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;
    const pngBuffer = await sharp(bytes).png().toBuffer();
    return pdfDoc.embedPng(pngBuffer);
  };

  let skippedPhotos = 0;
  if (photoAttachments.length === 0) {
    drawText('No photos uploaded.', margin, y, 11);
    y -= 16;
  } else {
    const colGap = 12;
    const rowGap = 12;
    const boxWidth = (width - margin * 2 - colGap) / 2;
    const boxHeight = 190;
    let col = 0;

    for (const attachment of photoAttachments) {
      const resolved = resolveUrl(attachment.url);
      if (!resolved) {
        skippedPhotos += 1;
        continue;
      }

      let image;
      try {
        const bytes = await fetchImageBytes(resolved);
        image = await embedImage(bytes, attachment.mimeType);
      } catch {
        skippedPhotos += 1;
        continue;
      }

      if (col === 0) {
        ensureSpace(boxHeight + rowGap);
      }

      const x = margin + col * (boxWidth + colGap);
      const yTop = y;

      page.drawRectangle({
        x,
        y: yTop - boxHeight,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 0.5
      });

      const scale = Math.min(boxWidth / image.width, boxHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = x + (boxWidth - drawWidth) / 2;
      const drawY = yTop - drawHeight - (boxHeight - drawHeight) / 2;

      page.drawImage(image, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight
      });

      if (col === 1) {
        y -= boxHeight + rowGap;
        col = 0;
      } else {
        col = 1;
      }
    }

    if (col === 1) {
      y -= boxHeight + rowGap;
    }

    if (skippedPhotos > 0) {
      drawText(`Some photos could not be embedded (${skippedPhotos} skipped).`, margin, y, 9);
      y -= 12;
    }
  }

  // Audit trail snippet
  if (readinessEvents.length > 0) {
    ensureSpace(120);
    y -= 10;
    drawLine(y);
    y -= 18;
    drawText('Audit Trail (latest)', margin, y, 13, true);
    y -= 18;
    for (const event of readinessEvents.slice(0, 5)) {
      const actor = event.actorName ? ` · ${event.actorName}` : '';
      drawText(
        `${event.status} · ${event.occurredAt.toLocaleString()}${actor}`,
        margin,
        y,
        10
      );
      y -= 14;
    }
  }

  // Footer
  const footerY = margin;
  drawLine(footerY + 10);
  drawText(
    `Exported ${new Date().toLocaleString()} · Seasonal Business Assistant`,
    margin,
    footerY,
    8
  );

  return pdfDoc.save();
}

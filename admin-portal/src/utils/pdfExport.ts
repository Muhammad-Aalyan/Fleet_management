import type { UserOptions } from 'jspdf-autotable'

export function sanitizeText(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↔/g, '<->')
    .replace(/[^\x00-\xFF]/g, '?')
}

/**
 * Load the brand mark and strip its solid background so it can be used as a
 * seamless watermark. logo.png has no alpha channel (it's an opaque square
 * tile with a flat backing color), so the corner color is sampled and any
 * pixel close to it is made transparent (with a feathered edge). Overall
 * fade is then applied at draw time via jsPDF's native graphics-state
 * opacity, giving a soft mark with no visible box edge.
 */
async function loadBrandMark(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const size = 500
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(''); return }
        const scale = Math.min(size / (img.naturalWidth || size), size / (img.naturalHeight || size))
        const w = (img.naturalWidth || size) * scale
        const h = (img.naturalHeight || size) * scale
        const dx = (size - w) / 2
        const dy = (size - h) / 2
        ctx.drawImage(img, dx, dy, w, h)

        const imageData = ctx.getImageData(0, 0, size, size)
        const data = imageData.data
        const sample = (px: number, py: number) => {
          const i = (Math.round(py) * size + Math.round(px)) * 4
          return [data[i], data[i + 1], data[i + 2]]
        }
        const corners = [
          sample(dx + 2, dy + 2),
          sample(dx + w - 3, dy + 2),
          sample(dx + 2, dy + h - 3),
          sample(dx + w - 3, dy + h - 3),
        ]
        const bg = [0, 1, 2].map(c => Math.round(corners.reduce((s, p) => s + p[c], 0) / corners.length))

        const LOW = 18
        const HIGH = 55
        for (let p = 0; p < data.length; p += 4) {
          const dr = data[p] - bg[0]
          const dg = data[p + 1] - bg[1]
          const db = data[p + 2] - bg[2]
          const dist = Math.sqrt(dr * dr + dg * dg + db * db)
          if (dist <= LOW) data[p + 3] = 0
          else if (dist < HIGH) data[p + 3] = Math.round(255 * ((dist - LOW) / (HIGH - LOW)))
        }
        ctx.putImageData(imageData, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch { resolve('') }
    }
    img.onerror = () => resolve('')
    img.src = `/logo.png?t=${Date.now()}`
  })
}

/** Re-fade an already-transparent PNG data URL (used for the Excel watermark). */
async function fadeDataUrl(dataUrl: string, opacity: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(dataUrl); return }
        ctx.globalAlpha = opacity
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch { resolve(dataUrl) }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

// ─── Brand palette (matches the "Ride On" branded report template) ─────────
const DARK: [number, number, number] = [18, 21, 28]     // #12151C
const RED: [number, number, number] = [214, 40, 40]      // #D62828
const RED_SOFT: [number, number, number] = [251, 234, 234] // #FBEAEA
const INK: [number, number, number] = [18, 21, 28]
const INK_SOFT: [number, number, number] = [91, 98, 112]
const INK_FAINT: [number, number, number] = [154, 161, 172]
const BORDER: [number, number, number] = [231, 233, 238]
const ROW_ALT: [number, number, number] = [250, 251, 252]
const WHITE: [number, number, number] = [255, 255, 255]

export interface SummaryCard {
  label: string
  value: string | number
  highlight?: boolean
}

export interface ExportConfig {
  title: string
  subtitle?: string
  sectionLabel?: string
  orientation?: 'portrait' | 'landscape'
  adminName: string
  recordCount: number
  head: string[]
  body: (string | number)[][]
  fileName: string
  summaryCards?: SummaryCard[]
  tableOptions?: Partial<UserOptions>
}

export async function exportPDF(cfg: ExportConfig) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: cfg.orientation ?? 'portrait', unit: 'mm', format: 'a4' })
    const watermark = await loadBrandMark()

    const pw = doc.internal.pageSize.width
    const ph = doc.internal.pageSize.height
    const M = 10

    // ── Header band (page 1 only) ──────────────────────────────────────────
    const headerH = cfg.subtitle ? 21 : 17
    doc.setFillColor(...DARK)
    doc.rect(0, 0, pw, headerH, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(...WHITE)
    doc.text(sanitizeText(cfg.title), M, 11)

    if (cfg.subtitle) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...INK_FAINT)
      doc.text(sanitizeText(cfg.subtitle), M, 16.5)
    }

    // Brand mark, right-aligned: "Ride " (white) + "On" (red), tag below
    const brandY = cfg.subtitle ? 9 : 9.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const rideText = 'Ride '
    const onText = 'On'
    const brandTotalW = doc.getTextWidth(rideText) + doc.getTextWidth(onText)
    let bx = pw - M - brandTotalW
    doc.setTextColor(...WHITE)
    doc.text(rideText, bx, brandY)
    bx += doc.getTextWidth(rideText)
    doc.setTextColor(...RED)
    doc.text(onText, bx, brandY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(139, 144, 156)
    doc.text('FLEET OPERATIONS', pw - M, brandY + 4.5, { align: 'right' })

    // Accent strip
    const accentH = 1.4
    doc.setFillColor(...RED)
    doc.rect(0, headerH, pw, accentH, 'F')

    // Meta bar
    const metaY0 = headerH + accentH
    const metaH = 10
    doc.setFillColor(250, 251, 253)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.25)
    doc.rect(0, metaY0, pw, metaH, 'FD')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...INK_SOFT)
    const metaTextY = metaY0 + metaH / 2 + 1.2
    doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, M, metaTextY)
    doc.text(`Downloaded by: ${sanitizeText(cfg.adminName)}`, pw / 2, metaTextY, { align: 'center' })

    // Record-count pill
    const pillText = `${cfg.recordCount} RECORD${cfg.recordCount !== 1 ? 'S' : ''}`
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    const pillTextW = doc.getTextWidth(pillText)
    const pillPadX = 3
    const pillW = pillTextW + pillPadX * 2
    const pillH = 5
    const pillX = pw - M - pillW
    const pillY = metaY0 + (metaH - pillH) / 2
    doc.setFillColor(...RED_SOFT)
    doc.roundedRect(pillX, pillY, pillW, pillH, 2, 2, 'F')
    doc.setTextColor(...RED)
    doc.text(pillText, pillX + pillPadX, pillY + pillH / 2 + 1.1)

    // Section label
    let startY = metaY0 + metaH + 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(...INK_FAINT)
    doc.text((cfg.sectionLabel ?? 'Report Data').toUpperCase(), M, startY)
    startY += 4

    // ── Table ─────────────────────────────────────────────────────────────
    const safeBody = cfg.body.map(row => row.map(cell => sanitizeText(cell)))

    autoTable(doc, {
      startY,
      head: [cfg.head],
      body: safeBody,
      margin: { left: M, right: M, bottom: 20 },
      styles: {
        fontSize: 8.2,
        cellPadding: 3.2,
        textColor: INK,
        lineColor: BORDER,
        lineWidth: 0.2,
        font: 'helvetica',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: DARK,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 7.8,
        cellPadding: 3.6,
      },
      alternateRowStyles: {
        fillColor: ROW_ALT,
      },
      tableLineColor: BORDER,
      tableLineWidth: 0.2,
      ...cfg.tableOptions,
    })

    // ── Summary cards ────────────────────────────────────────────────────
    if (cfg.summaryCards?.length) {
      const cards = cfg.summaryCards
      let cursorY = (doc as any).lastAutoTable.finalY + 8
      const gap = 4
      const cardW = (pw - M * 2 - gap * (cards.length - 1)) / cards.length
      const cardH = 16

      if (cursorY + cardH > ph - 20) {
        doc.addPage()
        cursorY = 14
      }

      cards.forEach((c, i) => {
        const x = M + i * (cardW + gap)
        doc.setDrawColor(...BORDER)
        doc.setLineWidth(0.25)
        doc.roundedRect(x, cursorY, cardW, cardH, 1.5, 1.5)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.3)
        doc.setTextColor(...INK_FAINT)
        doc.text(sanitizeText(c.label).toUpperCase(), x + 3, cursorY + 5.5)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11.5)
        doc.setTextColor(...(c.highlight ? RED : INK))
        doc.text(sanitizeText(c.value), x + 3, cursorY + 12.5)
      })
    }

    // ── Footer + watermark on every page ────────────────────────────────────
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)

      if (watermark) {
        const logoW = Math.min(pw * 0.4, 78)
        const x = (pw - logoW) / 2
        const y = (ph - logoW) / 2
        try {
          const d = doc as any
          d.saveGraphicsState()
          d.setGState(new d.GState({ opacity: 0.1 }))
          doc.addImage(watermark, 'PNG', x, y, logoW, logoW)
          d.restoreGraphicsState()
        } catch { /* ignore */ }
      }

      const fH = 15
      const fy0 = ph - fH

      doc.setDrawColor(...BORDER)
      doc.setLineWidth(0.2)
      doc.line(M, fy0, pw - M, fy0)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      const bring = 'BRING IT '
      const on = 'ON!'
      const taglineW = doc.getTextWidth(bring) + doc.getTextWidth(on)
      let tx = pw / 2 - taglineW / 2
      const ty = fy0 + 6.5
      doc.setTextColor(...DARK)
      doc.text(bring, tx, ty)
      tx += doc.getTextWidth(bring)
      doc.setTextColor(...RED)
      doc.text(on, tx, ty)

      const ruleLen = 8
      doc.setDrawColor(...RED)
      doc.setLineWidth(0.4)
      doc.line(pw / 2 - taglineW / 2 - ruleLen - 3, ty - 1.2, pw / 2 - taglineW / 2 - 3, ty - 1.2)
      doc.line(pw / 2 + taglineW / 2 + 3, ty - 1.2, pw / 2 + taglineW / 2 + ruleLen + 3, ty - 1.2)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(...INK_FAINT)
      doc.text(`Confidential report  ·  Page ${i} of ${totalPages}`, pw / 2, ty + 4.8, { align: 'center' })
    }

    doc.save(`${cfg.fileName}-${new Date().toISOString().slice(0, 10)}.pdf`)
  } catch (err) {
    console.error('[exportPDF] failed:', err)
    alert('PDF export failed: ' + (err as Error).message)
  }
}

// ─── Excel export ────────────────────────────────────────────────────────

export interface ExcelMeta {
  title?: string
  subtitle?: string
  sectionLabel?: string
  adminName?: string
  recordCount?: number
  summaryCards?: SummaryCard[]
}

const X_DARK = 'FF12151C'
const X_RED = 'FFD62828'
const X_RED_SOFT = 'FFFBEAEA'
const X_ROW_ALT = 'FFFAFBFC'
const X_BORDER = 'FFE7E9EE'
const X_INK = 'FF12151C'
const X_INK_SOFT = 'FF5B6270'
const X_INK_FAINT = 'FF9AA1AC'
const X_WHITE = 'FFFFFFFF'

export async function exportExcel(
  fileName: string,
  sheetName: string,
  data: Record<string, unknown>[],
  meta?: ExcelMeta,
) {
  const ExcelJS = await import('exceljs')
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ride On Fleet Operations'
  const ws = wb.addWorksheet(sheetName)

  const headers = data.length ? Object.keys(data[0]) : []
  const colCount = Math.max(headers.length, 1)

  const brandMark = await loadBrandMark()
  let headerImgId: number | undefined
  let watermarkImgId: number | undefined
  if (brandMark) {
    headerImgId = wb.addImage({ base64: brandMark, extension: 'png' })
    const faded = await fadeDataUrl(brandMark, 0.11)
    watermarkImgId = wb.addImage({ base64: faded, extension: 'png' })
  }

  let r = 1

  // Title row
  ws.mergeCells(r, 1, r, colCount)
  const titleCell = ws.getCell(r, 1)
  titleCell.value = meta?.title ?? sheetName
  titleCell.font = { bold: true, size: 14, color: { argb: X_WHITE } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(r).height = 30
  for (let c = 1; c <= colCount; c++) {
    ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_DARK } }
  }
  const titleRowIdx = r
  r++

  // Subtitle row
  if (meta?.subtitle) {
    ws.mergeCells(r, 1, r, colCount)
    const sc = ws.getCell(r, 1)
    sc.value = meta.subtitle
    sc.font = { italic: true, size: 10, color: { argb: X_INK_SOFT } }
    sc.alignment = { indent: 1 }
    r++
  }

  // Accent strip
  ws.mergeCells(r, 1, r, colCount)
  for (let c = 1; c <= colCount; c++) {
    ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_RED } }
  }
  ws.getRow(r).height = 4
  r++

  // Meta row: left = generated/downloaded-by, right cell = record-count badge
  const metaLeftSpan = Math.max(colCount - 1, 1)
  ws.mergeCells(r, 1, r, metaLeftSpan)
  const metaCell = ws.getCell(r, 1)
  metaCell.value = `Generated: ${new Date().toLocaleString('en-GB')}   |   Downloaded by: ${meta?.adminName ?? 'Admin'}`
  metaCell.font = { size: 9, color: { argb: X_INK_FAINT } }
  metaCell.alignment = { vertical: 'middle', indent: 1 }
  if (colCount > 1) {
    const badgeCell = ws.getCell(r, colCount)
    const count = meta?.recordCount ?? data.length
    badgeCell.value = `${count} RECORD${count !== 1 ? 'S' : ''}`
    badgeCell.font = { bold: true, size: 9, color: { argb: X_RED } }
    badgeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_RED_SOFT } }
    badgeCell.alignment = { vertical: 'middle', horizontal: 'center' }
  }
  ws.getRow(r).height = 18
  r += 2 // spacer row

  // Section label
  ws.mergeCells(r, 1, r, colCount)
  const sectionCell = ws.getCell(r, 1)
  sectionCell.value = (meta?.sectionLabel ?? 'Report Data').toUpperCase()
  sectionCell.font = { bold: true, size: 9, color: { argb: X_INK_FAINT } }
  sectionCell.alignment = { indent: 1 }
  r++

  // Table header row
  const headerRowIdx = r
  headers.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: X_WHITE }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_DARK } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'thin', color: { argb: X_BORDER } } }
  })
  ws.getRow(r).height = 20
  r++

  // Data rows
  const dataStartRow = r
  data.forEach((row, idx) => {
    headers.forEach((h, i) => {
      const cell = ws.getCell(r, i + 1)
      cell.value = row[h] as string | number | null
      cell.font = { size: 10, color: { argb: X_INK } }
      cell.border = { bottom: { style: 'thin', color: { argb: X_BORDER } } }
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: X_ROW_ALT } }
    })
    r++
  })
  const dataEndRow = r - 1

  // Summary section
  if (meta?.summaryCards?.length) {
    r++
    ws.mergeCells(r, 1, r, colCount)
    const sumHeader = ws.getCell(r, 1)
    sumHeader.value = 'SUMMARY'
    sumHeader.font = { bold: true, size: 10, color: { argb: X_INK_FAINT } }
    r++
    meta.summaryCards.forEach(card => {
      const labelCell = ws.getCell(r, 1)
      labelCell.value = card.label
      labelCell.font = { bold: true, size: 10, color: { argb: X_INK_SOFT } }
      const valueCell = ws.getCell(r, 2)
      valueCell.value = card.value as string | number
      valueCell.font = { bold: true, size: 11, color: { argb: card.highlight ? X_RED : X_INK } }
      r++
    })
  }

  // Footer
  r++
  ws.mergeCells(r, 1, r, colCount)
  const footCell = ws.getCell(r, 1)
  footCell.value = {
    richText: [
      { font: { bold: true, size: 9, color: { argb: X_DARK } }, text: 'BRING IT ' },
      { font: { bold: true, size: 9, color: { argb: X_RED } }, text: 'ON!' },
      { font: { size: 9, color: { argb: X_INK_FAINT } }, text: '   ·   Ride On Fleet Operations   ·   Confidential report' },
    ],
  }
  footCell.alignment = { horizontal: 'center' }

  // Column widths
  headers.forEach((h, i) => {
    const maxLen = Math.max(h.length, ...data.map(d => String(d[h] ?? '').length))
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 4, 10), 42)
  })

  ws.views = [{ state: 'frozen', ySplit: headerRowIdx }]

  // Header brand mark (top-right of the title band)
  if (headerImgId !== undefined) {
    ws.addImage(headerImgId, {
      tl: { col: colCount - 0.85, row: titleRowIdx - 1 + 0.08 },
      ext: { width: 42, height: 42 },
    })
  }

  // Faded watermark, centered over the data rows
  if (watermarkImgId !== undefined) {
    const wmSize = 220
    const midCol = Math.max(colCount / 2 - 2.2, 0)
    const midRow = Math.max((dataStartRow + dataEndRow) / 2 - 1 - 4, headerRowIdx)
    ws.addImage(watermarkImgId, {
      tl: { col: midCol, row: midRow },
      ext: { width: wmSize, height: wmSize },
    })
  }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

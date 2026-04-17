// src/utils/excelExport.ts
import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
    header: string;
    key: keyof T | string;
    width?: number;
    formatter?: (value: any, row: T) => string | number;
}

/**
 * Generic Excel export function
 */
export function exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: ExcelColumn<T>[],
    filename: string,
    sheetName = 'Sheet1'
): void {
    const rows = data.map((row) =>
        columns.reduce<Record<string, any>>((acc, col) => {
            const raw = col.key.toString().split('.').reduce((o, k) => o?.[k], row as any);
            acc[col.header] = col.formatter ? col.formatter(raw, row) : (raw ?? '');
            return acc;
        }, {})
    );

    const ws = XLSX.utils.json_to_sheet(rows, { header: columns.map((c) => c.header) });

    // Column widths
    ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 20 }));

    // Header style (bold)
    const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E3F2FD' } } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/** Format VND currency for Excel cells */
export const fmtVnd = (n: number | null | undefined): string => {
    if (n == null) return '0';
    return n.toLocaleString('vi-VN');
};
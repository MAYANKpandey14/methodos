export interface TableAction {
    type: 'addRow' | 'addCol' | 'deleteRow' | 'deleteCol' | 'format';
}

export function isCursorInTable(content: string, cursorIndex: number): boolean {
    const lines = content.split('\n');
    let loaded = 0;
    for (const line of lines) {
        const start = loaded;
        const end = loaded + line.length + 1; // +1 for newline
        if (cursorIndex >= start && cursorIndex <= end) {
            return line.trim().startsWith('|');
        }
        loaded = end;
    }
    return false;
}

export function getTableBlock(content: string, cursorIndex: number): { start: number; end: number; lines: string[]; activeRow: number } | null {
    const allLines = content.split('\n');
    let currentPos = 0;
    let activeLineIndex = -1;

    // Find active line index
    for (let i = 0; i < allLines.length; i++) {
        const len = allLines[i].length + 1;
        if (cursorIndex >= currentPos && cursorIndex <= currentPos + len) {
            activeLineIndex = i;
            break;
        }
        currentPos += len;
    }

    if (activeLineIndex === -1 || !allLines[activeLineIndex].trim().startsWith('|')) return null;

    // Find start of table
    let startLine = activeLineIndex;
    while (startLine > 0 && allLines[startLine - 1].trim().startsWith('|')) {
        startLine--;
    }

    // Find end of table
    let endLine = activeLineIndex;
    while (endLine < allLines.length - 1 && allLines[endLine + 1].trim().startsWith('|')) {
        endLine++;
    }

    // Calculate char positions
    const startPos = allLines.slice(0, startLine).reduce((acc, line) => acc + line.length + 1, 0);
    const tableLines = allLines.slice(startLine, endLine + 1);
    const endPos = startPos + tableLines.join('\n').length;

    return {
        start: startPos,
        end: endPos,
        lines: tableLines,
        activeRow: activeLineIndex - startLine
    };
}

export function processTableAction(content: string, cursorIndex: number, action: TableAction['type']): string {
    const table = getTableBlock(content, cursorIndex);
    if (!table) return content;

    const { lines, activeRow } = table;

    // Parse rows into cells
    const rows = lines.map(line =>
        line.split('|')
            .map(cell => cell.trim())
            .filter((cell, i, arr) => i !== 0 && i !== arr.length - 1) // Remove first and last empty splits from |...|
    );

    // Note: split('|') on "| a | b |" gives ["", " a ", " b ", ""]
    // If line is "| a | b |", we want ["a", "b"]

    // Check if header separator row
    const isSeparator = (row: string[]) => row.every(cell => cell.match(/^[-:]+$/));

    let newRows = [...rows];

    switch (action) {
        case 'addRow': {
            const numCols = rows[0].length;
            const newRow = Array(numCols).fill(' ');
            // Insert after active row
            newRows.splice(activeRow + 1, 0, newRow);
            break;
        }
        case 'addCol': {
            newRows = newRows.map(row => {
                // Check if separator
                if (isSeparator(row)) return [...row, '---'];
                return [...row, ' '];
            });
            break;
        }
        case 'deleteRow': {
            if (newRows.length > 1) { // Don't delete last row?
                newRows.splice(activeRow, 1);
            }
            break;
        }
        case 'format':
            // Just re-formatting (pass through)
            break;
    }

    // Formatting (Align columns)
    // 1. Calculate max width for each column
    const colWidths = newRows[0].map((_, colIndex) => {
        return Math.max(...newRows.map(row => (row[colIndex] || '').length));
    });

    // 2. Reconstruct lines
    const newLines = newRows.map(row => {
        const cells = row.map((cell, i) => {
            const width = Math.max(colWidths[i], 3); // Min width 3
            // Handle separator
            if (cell.match(/^[-:]+$/)) {
                return '-'.repeat(width);
            }
            return cell.padEnd(width, ' ');
        });
        return `| ${cells.join(' | ')} |`;
    });

    const newTableString = newLines.join('\n');

    return content.slice(0, table.start) + newTableString + content.slice(table.end);
}

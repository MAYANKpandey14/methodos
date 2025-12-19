import React from 'react';
import { Button } from '@/components/ui/button';
import {
    AlignLeft,
    Plus,
    Trash,
    ArrowDown,
    ArrowRight,
    Columns,
    Rows
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface TableControlsProps {
    position: { top: number; left: number };
    onAddRow: () => void;
    onAddCol: () => void;
    onDeleteRow: () => void;
    onDeleteCol: () => void;
    onFormat: () => void;
}

export function TableControls({
    position,
    onAddRow,
    onAddCol,
    onDeleteRow,
    onDeleteCol,
    onFormat
}: TableControlsProps) {
    return (
        <div
            className="fixed z-50 flex items-center gap-1 p-1 bg-popover text-popover-foreground rounded-md border shadow-md animate-in fade-in zoom-in-95 duration-200"
            style={{
                top: position.top - 45, // Position above the cursor/table
                left: position.left
            }}
        >
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddRow}>
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Row</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddCol}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Column</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDeleteRow}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Row</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onFormat}>
                            <AlignLeft className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Format Table</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

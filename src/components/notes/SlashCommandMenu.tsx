import React, { useEffect, useState } from 'react';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    CheckSquare,
    Quote,
    Code,
    Image,
    Link,
    Table,
    Minus
} from 'lucide-react';

interface SlashCommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (command: string) => void;
    position: { top: number; left: number };
}

export function SlashCommandMenu({ open, onOpenChange, onSelect, position }: SlashCommandMenuProps) {
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [onOpenChange]);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <div
                    className="fixed w-0 h-0"
                    style={{
                        top: position.top,
                        left: position.left,
                        position: 'fixed'
                    }}
                />
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[300px]"
                align="start"
                side="bottom"
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <Command>
                    <CommandInput placeholder="Type a command or search..." autoFocus />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="Basics">
                            <CommandItem onSelect={() => onSelect('heading1')}>
                                <Heading1 className="mr-2 h-4 w-4" />
                                <span>Heading 1</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('heading2')}>
                                <Heading2 className="mr-2 h-4 w-4" />
                                <span>Heading 2</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('heading3')}>
                                <Heading3 className="mr-2 h-4 w-4" />
                                <span>Heading 3</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('unordered-list')}>
                                <List className="mr-2 h-4 w-4" />
                                <span>Bullet List</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('ordered-list')}>
                                <ListOrdered className="mr-2 h-4 w-4" />
                                <span>Numbered List</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('task-list')}>
                                <CheckSquare className="mr-2 h-4 w-4" />
                                <span>Task List</span>
                            </CommandItem>
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup heading="Advanced">
                            <CommandItem onSelect={() => onSelect('blockquote')}>
                                <Quote className="mr-2 h-4 w-4" />
                                <span>Quote</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('code-block')}>
                                <Code className="mr-2 h-4 w-4" />
                                <span>Code Block</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('table')}>
                                <Table className="mr-2 h-4 w-4" />
                                <span>Table</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('horizontal-rule')}>
                                <Minus className="mr-2 h-4 w-4" />
                                <span>Divider</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('image')}>
                                <Image className="mr-2 h-4 w-4" />
                                <span>Image</span>
                            </CommandItem>
                            <CommandItem onSelect={() => onSelect('link')}>
                                <Link className="mr-2 h-4 w-4" />
                                <span>Link</span>
                            </CommandItem>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

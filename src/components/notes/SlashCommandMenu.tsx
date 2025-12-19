import React, { useEffect } from 'react';
import {
    Command,
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
    Minus,
    Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlashCommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (command: string) => void;
    position: { top: number; left: number };
}

interface CommandItemProps {
    title: string;
    description: string;
    icon: React.ElementType;
    value: string;
}

const GROUPS: { heading: string; items: CommandItemProps[] }[] = [
    {
        heading: "Basics",
        items: [
            {
                title: "Text",
                description: "Just start writing with plain text.",
                icon: Type,
                value: "text",
            },
            {
                title: "Heading 1",
                description: "Big section heading.",
                icon: Heading1,
                value: "heading1",
            },
            {
                title: "Heading 2",
                description: "Medium section heading.",
                icon: Heading2,
                value: "heading2",
            },
            {
                title: "Heading 3",
                description: "Small section heading.",
                icon: Heading3,
                value: "heading3",
            },
            {
                title: "Bullet List",
                description: "Create a simple bulleted list.",
                icon: List,
                value: "unordered-list",
            },
            {
                title: "Numbered List",
                description: "Create a list with numbering.",
                icon: ListOrdered,
                value: "ordered-list",
            },
            {
                title: "Task List",
                description: "Track tasks with a todo list.",
                icon: CheckSquare,
                value: "task-list",
            },
        ],
    },
    {
        heading: "Advanced",
        items: [
            {
                title: "Quote",
                description: "Capture a quote.",
                icon: Quote,
                value: "blockquote",
            },
            {
                title: "Code Block",
                description: "Capture a code snippet.",
                icon: Code,
                value: "code-block",
            },
            {
                title: "Table",
                description: "Add simple tabular content.",
                icon: Table,
                value: "table",
            },
            {
                title: "Divider",
                description: "Visually separate content.",
                icon: Minus,
                value: "horizontal-rule",
            },
            {
                title: "Image",
                description: "Upload or embed with a link.",
                icon: Image,
                value: "image",
            },
            {
                title: "Link",
                description: "Add a link to existing content.",
                icon: Link,
                value: "link",
            },
        ],
    },
];

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
                    }}
                />
            </PopoverTrigger>
            <PopoverContent
                className="p-0 w-[400px] overflow-hidden rounded-xl border-border shadow-2xl"
                align="start"
                side="bottom"
                sideOffset={5}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <Command className="border-none">
                    <CommandInput
                        placeholder="Type a command or search..."
                        autoFocus
                        className="border-none focus:ring-0 text-base py-3"
                    />
                    <CommandList className="max-h-[330px]">
                        <CommandEmpty>No results found.</CommandEmpty>
                        {GROUPS.map((group, groupIndex) => (
                            <React.Fragment key={group.heading}>
                                <CommandGroup heading={group.heading} className="text-muted-foreground/80">
                                    {group.items.map((item) => (
                                        <CommandItem
                                            key={item.value}
                                            onSelect={() => onSelect(item.value)}
                                            className="cursor-pointer aria-selected:bg-accent/50 py-2.5 px-3 rounded-lg mx-1"
                                            value={item.title} // Search by title
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/40 bg-background shadow-sm">
                                                    <item.icon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-medium leading-none text-foreground/90">
                                                        {item.title}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground/70 line-clamp-1">
                                                        {item.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {groupIndex < GROUPS.length - 1 && <CommandSeparator className="my-1" />}
                            </React.Fragment>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

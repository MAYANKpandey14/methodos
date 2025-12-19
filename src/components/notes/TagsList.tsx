import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsListProps {
    tags?: string[];
    className?: string;
}

export function TagsList({ tags, className }: TagsListProps) {
    if (!tags || tags.length === 0) return null;

    return (
        <div className={cn("flex flex-wrap gap-2 items-center", className)}>
            <TagIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5 font-normal">
                    {tag}
                </Badge>
            ))}
        </div>
    );
}

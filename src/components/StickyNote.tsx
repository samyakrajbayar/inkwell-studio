import { useState } from "react";
import { useDrag } from "react-dnd";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { cn } from "@/lib/utils";

export type NoteColor = "yellow" | "pink" | "blue" | "green" | "purple";

interface StickyNoteProps {
  id: string;
  content: string;
  color: NoteColor;
  rotation: number;
  position: { x: number; y: number };
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

const colorClasses: Record<NoteColor, string> = {
  yellow: "bg-note-yellow",
  pink: "bg-note-pink",
  blue: "bg-note-blue",
  green: "bg-note-green",
  purple: "bg-note-purple",
};

export const StickyNote = ({
  id,
  content,
  color,
  rotation,
  position,
  onUpdate,
  onDelete,
  onMove,
}: StickyNoteProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "note",
      item: { id, position },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (item, monitor) => {
        const offset = monitor.getDifferenceFromInitialOffset();
        if (offset) {
          const newX = Math.round(position.x + offset.x);
          const newY = Math.round(position.y + offset.y);
          onMove(id, newX, newY);
        }
      },
    }),
    [id, position, onMove]
  );

  const handleBlur = () => {
    setIsEditing(false);
    if (localContent !== content) {
      onUpdate(id, localContent);
    }
  };

  return (
    <div
      ref={drag}
      className={cn(
        "absolute w-64 h-64 p-6 cursor-move transition-all duration-200",
        "hover:scale-105 hover:z-10",
        colorClasses[color],
        isDragging && "opacity-50"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `rotate(${rotation}deg)`,
        boxShadow: isDragging
          ? "var(--shadow-note-hover)"
          : "var(--shadow-note)",
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 w-8 h-8 opacity-0 hover:opacity-100 transition-opacity"
        onClick={() => onDelete(id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      
      {isEditing ? (
        <Textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          onBlur={handleBlur}
          className="w-full h-full bg-transparent border-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-handwriting text-lg"
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="w-full h-full overflow-auto font-handwriting text-lg whitespace-pre-wrap"
        >
          {content || "Click to edit..."}
        </div>
      )}
    </div>
  );
};

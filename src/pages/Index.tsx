import { useState, useEffect } from "react";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StickyNote, NoteColor } from "@/components/StickyNote";
import { FontGenerator } from "@/components/FontGenerator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Note {
  id: string;
  content: string;
  color: NoteColor;
  rotation: number;
  position: { x: number; y: number };
}

const colors: NoteColor[] = ["yellow", "pink", "blue", "green", "purple"];

const Board = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("sticky_notes")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const loadedNotes = data.map((note) => ({
        id: note.id,
        content: note.content,
        color: note.color as NoteColor,
        rotation: Number(note.rotation),
        position: { x: note.position_x, y: note.position_y },
      }));

      setNotes(loadedNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const [, drop] = useDrop(() => ({
    accept: "note",
  }));

  const addNote = async () => {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomRotation = (Math.random() - 0.5) * 6;
    const randomX = Math.random() * (window.innerWidth - 300);
    const randomY = Math.random() * (window.innerHeight - 300);

    try {
      const { data, error } = await supabase
        .from("sticky_notes")
        .insert([
          {
            content: "",
            color: randomColor,
            rotation: randomRotation,
            position_x: Math.round(randomX),
            position_y: Math.round(randomY),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        id: data.id,
        content: data.content,
        color: data.color as NoteColor,
        rotation: Number(data.rotation),
        position: { x: data.position_x, y: data.position_y },
      };

      setNotes([...notes, newNote]);
      toast.success("New note added!");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const updateNote = async (id: string, content: string) => {
    try {
      const { error } = await supabase
        .from("sticky_notes")
        .update({ content })
        .eq("id", id);

      if (error) throw error;

      setNotes(
        notes.map((note) => (note.id === id ? { ...note, content } : note))
      );
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const moveNote = async (id: string, x: number, y: number) => {
    try {
      const { error } = await supabase
        .from("sticky_notes")
        .update({ position_x: x, position_y: y })
        .eq("id", id);

      if (error) throw error;

      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, position: { x, y } } : note
        )
      );
    } catch (error) {
      console.error("Error moving note:", error);
      toast.error("Failed to move note");
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sticky_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotes(notes.filter((note) => note.id !== id));
      toast.success("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  return (
    <div
      ref={drop}
      className="min-h-screen w-full bg-background relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 2px 2px, hsl(var(--muted)) 1px, transparent 0)
        `,
        backgroundSize: "40px 40px",
      }}
    >
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Font Generator</DialogTitle>
            </DialogHeader>
            <FontGenerator onFontGenerated={loadNotes} />
          </DialogContent>
        </Dialog>

        <Button onClick={addNote} size="icon">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      ) : (
        notes.map((note) => (
          <StickyNote
            key={note.id}
            id={note.id}
            content={note.content}
            color={note.color}
            rotation={note.rotation}
            position={note.position}
            onUpdate={updateNote}
            onDelete={deleteNote}
            onMove={moveNote}
          />
        ))
      )}
    </div>
  );
};

const Index = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Board />
    </DndProvider>
  );
};

export default Index;

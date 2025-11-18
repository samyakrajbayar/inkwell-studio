import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Wand2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FontGeneratorProps {
  onFontGenerated: () => void;
}

export const FontGenerator = ({ onFontGenerated }: FontGeneratorProps) => {
  const [fontName, setFontName] = useState("");
  const [handwritingSample, setHandwritingSample] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!fontName || !handwritingSample) {
      toast.error("Please provide both a font name and handwriting sample");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-font", {
        body: { fontName, handwritingSample },
      });

      if (error) throw error;

      toast.success("Font generated successfully!");
      setFontName("");
      setHandwritingSample("");
      onFontGenerated();
    } catch (error) {
      console.error("Error generating font:", error);
      toast.error("Failed to generate font. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Font Generator
        </CardTitle>
        <CardDescription>
          Create a custom handwriting font from your text sample
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fontName">Font Name</Label>
          <Input
            id="fontName"
            placeholder="My Custom Font"
            value={fontName}
            onChange={(e) => setFontName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sample">Handwriting Sample</Label>
          <textarea
            id="sample"
            className="w-full min-h-[120px] p-3 border rounded-md bg-background resize-none"
            placeholder="Write a sample text here... The AI will analyze your writing style and create a font."
            value={handwritingSample}
            onChange={(e) => setHandwritingSample(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Tip: Write several sentences with varied letters for best results
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !fontName || !handwritingSample}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Generating Font...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Font
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

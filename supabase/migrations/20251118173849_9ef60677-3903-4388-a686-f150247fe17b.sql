-- Create sticky notes table
CREATE TABLE IF NOT EXISTS public.sticky_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  rotation NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom fonts table for AI-generated fonts
CREATE TABLE IF NOT EXISTS public.custom_fonts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  font_name TEXT NOT NULL,
  font_data TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fonts ENABLE ROW LEVEL SECURITY;

-- Create policies - public access for this demo
CREATE POLICY "Anyone can view sticky notes" 
ON public.sticky_notes 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create sticky notes" 
ON public.sticky_notes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sticky notes" 
ON public.sticky_notes 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sticky notes" 
ON public.sticky_notes 
FOR DELETE 
USING (true);

CREATE POLICY "Anyone can view custom fonts" 
ON public.custom_fonts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create custom fonts" 
ON public.custom_fonts 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_sticky_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sticky_notes_timestamp
BEFORE UPDATE ON public.sticky_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_sticky_notes_updated_at();
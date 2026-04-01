import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  type: "primary" | "secondary" | "accent";
}

// Predefined colors palette
const primaryColors = [
  "#c1121f",
  "#d8315b",
  "#e63946",
  "#e76f51",
  "#e2711d",
  "#fb8500",
  "#023047",
  "#03045e",
  "#0077b6",
  "#2a9d8f",
  "#3d348b",
  "#7b2cbf",
  "#b5179e",
  "#3a5a40",
  "#008000",
  "#70e000",
  "#403E43",
];

const secondaryColors = [
  "#faecee",
  "#fbeef3",
  "#fbecee",
  "#fcefe9",
  "#fcefe5",
  "#fff3e0",
  "#e9edf0",
  "#e9ebf2",
  "#e9f3f9",
  "#eef8f6",
  "#efedf6",
  "#f5edf9",
  "#faecf6",
  "#edf1ee",
  "#e9f9e9",
  "#f4fdf0",
  "#f0f0f1",
];

const accentColors = [
  "#c1121f",
  "#d8315b",
  "#e63946",
  "#e76f51",
  "#e2711d",
  "#fb8500",
  "#023047",
  "#03045e",
  "#0077b6",
  "#2a9d8f",
  "#3d348b",
  "#7b2cbf",
  "#b5179e",
  "#3a5a40",
  "#008000",
  "#70e000",
  "#403E43",
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  type,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectColor = (selectedColor: string) => {
    onChange(selectedColor);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-10 p-0 border"
          style={{ backgroundColor: color }}
          title="Seleziona colore"
        >
          <Palette className="h-4 w-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.5)]" />
          <span className="sr-only">Seleziona colore</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-2">
          <div className="font-medium text-sm mb-2">Colori predefiniti</div>
          <div className="grid grid-cols-8 gap-1">
            {(type === "primary"
              ? primaryColors
              : type === "secondary"
              ? secondaryColors
              : accentColors
            ).map((predefinedColor, index) => (
              <button
                key={index}
                className="w-6 h-6 rounded-md border border-gray-200 shadow-sm"
                style={{ backgroundColor: predefinedColor }}
                onClick={() => handleSelectColor(predefinedColor)}
                title={predefinedColor}
              />
            ))}
          </div>
          <div className="pt-2">
            <label htmlFor="custom-color" className="font-medium text-sm">
              Colore personalizzato
            </label>
            <div className="flex mt-1">
              <input
                id="custom-color"
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

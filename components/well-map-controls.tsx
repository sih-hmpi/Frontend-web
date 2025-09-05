"use client";

import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Play, Pause } from "lucide-react";

export function WellMapControls({
  timeRange,
  currentTime,
  onTimeChange,
  onPlay,
  isPlaying
}: {
  timeRange: [number, number];
  currentTime: number;
  onTimeChange: (time: number) => void;
  onPlay: () => void;
  isPlaying: boolean;
}) {
  return (
    <Card className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-96 z-[1000]">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Time Control</Label>
            <Button size="sm" variant="outline" onClick={onPlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
          <Slider
            value={[currentTime]}
            min={timeRange[0]}
            max={timeRange[1]}
            step={1}
            onValueChange={([value]) => onTimeChange(value)}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{timeRange[0]}</span>
            <span>{currentTime}</span>
            <span>{timeRange[1]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
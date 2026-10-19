"use client";

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowsLeftRight,
  ArrowsOut,
  BookOpen,
  Check,
  Cube,
  DotsThree,
  DownloadSimple,
  Flask,
  Gear,
  GridFour,
  Heart,
  MagnifyingGlass,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Medal,
  Pause,
  Play,
  Question,
  ShareNetwork,
  Sparkle,
  SpeakerHigh,
  SpeakerSlash,
  X,
  type Icon as PhosphorIcon,
  type IconWeight,
} from "@phosphor-icons/react";

const icons = {
  search: MagnifyingGlass,
  menu: DotsThree,
  up: ArrowUp,
  down: ArrowDown,
  spread: Cube,
  table: GridFour,
  done: Check,
  close: X,
  favorite: Heart,
  learn: BookOpen,
  compare: ArrowsLeftRight,
  settings: Gear,
  rotate: ArrowClockwise,
  zoomIn: MagnifyingGlassPlus,
  zoomOut: MagnifyingGlassMinus,
  reset: ArrowCounterClockwise,
  share: ShareNetwork,
  play: Play,
  pause: Pause,
  spark: Sparkle,
  previous: ArrowLeft,
  next: ArrowRight,
  help: Question,
  sandbox: Flask,
  award: Medal,
  download: DownloadSimple,
  fullscreen: ArrowsOut,
  soundOn: SpeakerHigh,
  soundOff: SpeakerSlash,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof icons;

/** Outline by default. Pass `fill` for the solid weight. */
export function Icon({
  name,
  weight = "regular",
  size = 20,
}: {
  name: IconName;
  weight?: Extract<IconWeight, "regular" | "fill">;
  size?: number;
}) {
  const Glyph = icons[name];
  return <Glyph size={size} weight={weight} aria-hidden="true" />;
}

"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { DoomEngine } from "@/lib/doom/engine";
import {
  GRADES,
  QUALITY_TIERS,
  type Settings,
  type ShaderGrade,
} from "@/lib/doom/settings";
import type { QualityMode } from "@/lib/doom/types";

// ─── SETTINGS — the pilgrim's control over the light itself ────────────────
// Quality tiers, six screen-shader grades (PEARL → RETRO DOOM), FOV, bloom,
// sensitivity, head-bob, dust, god rays, volume. Applied LIVE to the engine.

export function SettingsDialog({
  engine,
  open,
  onOpenChange,
}: {
  engine: DoomEngine | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#120d06] border-2 border-amber-800/70 font-mono text-neutral-200 max-h-[88vh] overflow-y-auto">
        {engine ? (
          <SettingsPanel key="panel" engine={engine} />
        ) : (
          <div className="text-neutral-500 text-xs py-6 text-center tracking-widest">
            THE TEMPLE IS STILL WAKING…
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SettingsPanel({ engine }: { engine: DoomEngine }) {
  const [s, setS] = useState<Settings>(() => engine.getSettings());

  const apply = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    engine.applySettings(next);
  };

  const gradeNames = Object.keys(GRADES) as ShaderGrade[];
  const tierNames = Object.keys(QUALITY_TIERS) as QualityMode[];

  return (
    <div>
      <div className="mb-4">
        <div className="text-amber-300 font-black tracking-widest text-base">
          ⚙ SETTINGS — COMMAND THE LIGHT
        </div>
        <div className="text-[10px] text-neutral-500 tracking-[0.25em] mt-0.5">
          APPLIED LIVE · PERSISTED FOREVER
        </div>
      </div>

      <Tabs defaultValue="visuals" className="w-full">
        <TabsList className="grid grid-cols-3 bg-[#1a1207] border border-amber-900/60 h-9">
          <TabsTrigger value="visuals" className="text-[11px] data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-200">VISUALS</TabsTrigger>
          <TabsTrigger value="shaders" className="text-[11px] data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-200">SCREEN SHADER</TabsTrigger>
          <TabsTrigger value="controls" className="text-[11px] data-[state=active]:bg-amber-900/40 data-[state=active]:text-amber-200">CONTROLS</TabsTrigger>
        </TabsList>

        <TabsContent value="visuals" className="space-y-5 pt-4">
          {/* quality tier */}
          <div>
            <Label className="text-[10px] tracking-[0.25em] text-amber-600">QUALITY TIER</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {tierNames.map((t) => (
                <button
                  key={t}
                  onClick={() => apply({ quality: t })}
                  aria-pressed={s.quality === t}
                  className={`p-2.5 border text-left transition-colors ${
                    s.quality === t
                      ? "border-amber-400 bg-amber-900/40 text-amber-200"
                      : "border-amber-900/60 bg-[#1a1207]/60 text-neutral-400 hover:border-amber-700"
                  }`}
                >
                  <div className="text-xs font-bold tracking-widest">{QUALITY_TIERS[t].label}</div>
                  <div className="text-[9px] leading-tight mt-1 opacity-70">{QUALITY_TIERS[t].desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* bloom */}
          <div>
            <div className="flex justify-between">
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">DIVINE BLOOM</Label>
              <span className="text-[10px] text-amber-300 tabular-nums">{Math.round(s.bloom * 100)}%</span>
            </div>
            <Slider
              value={[s.bloom]}
              min={0}
              max={1.4}
              step={0.05}
              onValueChange={([v]) => apply({ bloom: v })}
              className="mt-2"
              aria-label="Bloom strength"
            />
          </div>

          {/* fov */}
          <div>
            <div className="flex justify-between">
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">FIELD OF VIEW</Label>
              <span className="text-[10px] text-amber-300 tabular-nums">{s.fov}°</span>
            </div>
            <Slider
              value={[s.fov]}
              min={60}
              max={100}
              step={1}
              onValueChange={([v]) => apply({ fov: v })}
              className="mt-2"
              aria-label="Field of view"
            />
          </div>

          {/* angel dust */}
          <div>
            <div className="flex justify-between">
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">ANGEL DUST</Label>
              <span className="text-[10px] text-amber-300 tabular-nums">{Math.round(s.dust * 100)}%</span>
            </div>
            <Slider
              value={[s.dust]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={([v]) => apply({ dust: v })}
              className="mt-2"
              aria-label="Dust density"
            />
          </div>

          {/* god rays */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">GOD RAYS</Label>
              <div className="text-[9px] text-neutral-500 mt-0.5">volumetric light shafts</div>
            </div>
            <Switch checked={s.godRays} onCheckedChange={(v) => apply({ godRays: v })} aria-label="Toggle god rays" />
          </div>
        </TabsContent>

        <TabsContent value="shaders" className="space-y-3 pt-4">
          <div className="text-[10px] text-neutral-500 tracking-[0.2em] pb-1">
            FULL-SCREEN COLOR GRADE — PICK YOUR CENTURY
          </div>
          {gradeNames.map((g) => (
            <button
              key={g}
              onClick={() => apply({ grade: g })}
              aria-pressed={s.grade === g}
              className={`w-full p-3 border text-left transition-colors ${
                s.grade === g
                  ? "border-amber-400 bg-amber-900/40"
                  : "border-amber-900/60 bg-[#1a1207]/60 hover:border-amber-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold tracking-widest ${s.grade === g ? "text-amber-200" : "text-neutral-300"}`}>
                  {GRADES[g].label}
                </span>
                {s.grade === g && <span className="text-[9px] text-amber-400 tracking-widest">ACTIVE ✦</span>}
              </div>
              <div className="text-[9px] text-neutral-500 mt-1 leading-relaxed">{GRADES[g].desc}</div>
            </button>
          ))}
        </TabsContent>

        <TabsContent value="controls" className="space-y-5 pt-4">
          {/* sensitivity */}
          <div>
            <div className="flex justify-between">
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">LOOK SENSITIVITY</Label>
              <span className="text-[10px] text-amber-300 tabular-nums">{s.sensitivity.toFixed(2)}×</span>
            </div>
            <Slider
              value={[s.sensitivity]}
              min={0.4}
              max={2}
              step={0.05}
              onValueChange={([v]) => apply({ sensitivity: v })}
              className="mt-2"
              aria-label="Mouse sensitivity"
            />
          </div>

          {/* volume */}
          <div>
            <div className="flex justify-between">
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">CHOIR VOLUME</Label>
              <span className="text-[10px] text-amber-300 tabular-nums">{Math.round(s.volume * 100)}%</span>
            </div>
            <Slider
              value={[s.volume]}
              min={0}
              max={1}
              step={0.05}
              onValueChange={([v]) => apply({ volume: v })}
              className="mt-2"
              aria-label="Volume"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">INVERT LOOK Y</Label>
              <div className="text-[9px] text-neutral-500 mt-0.5">for inverted pilgrims</div>
            </div>
            <Switch checked={s.invertY} onCheckedChange={(v) => apply({ invertY: v })} aria-label="Invert vertical look" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">HEAD BOB</Label>
              <div className="text-[9px] text-neutral-500 mt-0.5">the walk becomes a procession</div>
            </div>
            <Switch checked={s.headBob} onCheckedChange={(v) => apply({ headBob: v })} aria-label="Toggle head bob" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[10px] tracking-[0.25em] text-amber-600">SHOW FPS</Label>
              <div className="text-[9px] text-neutral-500 mt-0.5">honest numbers on the HUD</div>
            </div>
            <Switch checked={s.showFps} onCheckedChange={(v) => apply({ showFps: v })} aria-label="Toggle FPS display" />
          </div>

          <div className="text-[9px] text-neutral-600 leading-relaxed pt-2 border-t border-neutral-800">
            KEYBOARD — <span className="text-amber-500">WASD</span> walk ·{" "}
            <span className="text-amber-500">SHIFT</span> run ·{" "}
            <span className="text-amber-500">E</span> interact / use / sit ·{" "}
            <span className="text-amber-500">R</span> carry &amp; re-place owned relics ·{" "}
            <span className="text-amber-500">Q</span> lower camera / stand ·{" "}
            <span className="text-amber-500">G</span> these settings
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

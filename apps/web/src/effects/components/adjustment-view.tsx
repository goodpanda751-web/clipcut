"use client";

import { useState } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useEditor } from "@/editor/use-editor";
import { buildEffectElement } from "@/timeline/element-utils";
import {
	FILTER_PRESETS,
	type FilterPreset,
} from "@/effects/definitions/color-adjust";

/**
 * ClipCut Phase 1 — Adjustment panel.
 *
 * One-tap filter presets. Each preset inserts a Colour Adjust effect
 * element at the playhead with the preset's brightness / contrast /
 * saturation / warmth values. The effect element can then be dragged
 * to cover the clips it should grade, and fine-tuned from the
 * Properties panel (the same sliders, via the Colour Adjust effect).
 */
export function AdjustmentView() {
	const editor = useEditor();
	const [status, setStatus] = useState<string | null>(null);

	const applyPreset = ({ preset }: { preset: FilterPreset }) => {
		const currentTime = editor.playback.getCurrentTime();
		const element = {
			...buildEffectElement({
				effectType: "color-adjust",
				startTime: currentTime,
			}),
			name: `Filter · ${preset.name}`,
			params: { ...preset.params },
		};

		editor.timeline.insertElement({
			placement: { mode: "auto", trackType: "effect" },
			element,
		});
		setStatus(
			`${preset.name} filter added at the playhead. Drag it to cover your clips, then select it to fine-tune the sliders.`,
		);
	};

	return (
		<PanelView title="Adjustment">
			<p className="text-muted-foreground px-1 pb-3 text-xs">
				Tap a filter to apply it at the playhead. For manual control, add
				the Colour Adjust effect from the Effects tab instead.
			</p>
			<div
				className="grid gap-2"
				style={{
					gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
				}}
			>
				{FILTER_PRESETS.map((preset) => (
					<button
						key={preset.id}
						type="button"
						onClick={() => applyPreset({ preset })}
						className="bg-secondary/40 hover:bg-secondary flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-md border p-2"
					>
						<span
							aria-hidden
							className="size-8 rounded-full border"
							style={{ background: swatchFor({ preset }) }}
						/>
						<span className="text-xs">{preset.name}</span>
					</button>
				))}
			</div>
			{status && <p className="px-1 pt-3 text-xs">{status}</p>}
		</PanelView>
	);
}

/** A rough visual hint of the grade — not a render of the actual shader. */
function swatchFor({ preset }: { preset: FilterPreset }): string {
	const { saturation, warmth } = preset.params;
	if (saturation <= -100) return "linear-gradient(135deg,#e5e5e5,#404040)";
	if (warmth >= 25) return "linear-gradient(135deg,#fbbf24,#dc2626)";
	if (warmth <= -25) return "linear-gradient(135deg,#7dd3fc,#1d4ed8)";
	if (saturation >= 30) return "linear-gradient(135deg,#f472b6,#7c3aed)";
	return "linear-gradient(135deg,#a3a3a3,#525252)";
}

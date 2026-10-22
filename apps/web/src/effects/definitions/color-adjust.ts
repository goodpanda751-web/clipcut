import type { EffectDefinition } from "@/effects/types";
import type { ParamValues } from "@/params";

export const COLOR_ADJUST_SHADER = "color-adjust";

/** Params are authored in -100..100 in the UI and sent to the shader in -1..1. */
function paramToUnit({
	effectParams,
	key,
}: {
	effectParams: ParamValues;
	key: string;
}): number {
	const raw = effectParams[key];
	const value = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
	if (Number.isNaN(value)) return 0;
	return Math.max(-1, Math.min(1, value / 100));
}

export const colorAdjustEffectDefinition: EffectDefinition = {
	type: "color-adjust",
	name: "Colour Adjust",
	keywords: [
		"color",
		"colour",
		"filter",
		"brightness",
		"contrast",
		"saturation",
		"warmth",
		"grade",
	],
	params: [
		{
			key: "brightness",
			label: "Brightness",
			type: "number",
			default: 0,
			min: -100,
			max: 100,
			step: 1,
		},
		{
			key: "contrast",
			label: "Contrast",
			type: "number",
			default: 0,
			min: -100,
			max: 100,
			step: 1,
		},
		{
			key: "saturation",
			label: "Saturation",
			type: "number",
			default: 0,
			min: -100,
			max: 100,
			step: 1,
		},
		{
			key: "warmth",
			label: "Warmth",
			type: "number",
			default: 0,
			min: -100,
			max: 100,
			step: 1,
		},
	],
	renderer: {
		passes: [
			{
				shader: COLOR_ADJUST_SHADER,
				uniforms: ({ effectParams }) => ({
					u_brightness: paramToUnit({ effectParams, key: "brightness" }),
					u_contrast: paramToUnit({ effectParams, key: "contrast" }),
					u_saturation: paramToUnit({ effectParams, key: "saturation" }),
					u_warmth: paramToUnit({ effectParams, key: "warmth" }),
				}),
			},
		],
	},
};

/**
 * One-tap filter presets for the Adjustment panel (ClipCut Phase 1).
 * Values use the same -100..100 param scale as the Colour Adjust effect.
 */
export interface FilterPreset {
	id: string;
	name: string;
	params: {
		brightness: number;
		contrast: number;
		saturation: number;
		warmth: number;
	};
}

export const FILTER_PRESETS: FilterPreset[] = [
	{
		id: "vivid",
		name: "Vivid",
		params: { brightness: 4, contrast: 18, saturation: 35, warmth: 4 },
	},
	{
		id: "warm",
		name: "Warm",
		params: { brightness: 6, contrast: 6, saturation: 12, warmth: 38 },
	},
	{
		id: "cool",
		name: "Cool",
		params: { brightness: 2, contrast: 8, saturation: 6, warmth: -36 },
	},
	{
		id: "mono",
		name: "Mono",
		params: { brightness: 0, contrast: 14, saturation: -100, warmth: 0 },
	},
	{
		id: "fade",
		name: "Fade",
		params: { brightness: 10, contrast: -24, saturation: -22, warmth: 8 },
	},
	{
		id: "punch",
		name: "Punch",
		params: { brightness: -2, contrast: 30, saturation: 20, warmth: 0 },
	},
	{
		id: "soft",
		name: "Soft",
		params: { brightness: 8, contrast: -10, saturation: -8, warmth: 10 },
	},
	{
		id: "drama",
		name: "Drama",
		params: { brightness: -8, contrast: 26, saturation: -14, warmth: -6 },
	},
];

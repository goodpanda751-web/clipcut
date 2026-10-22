import type { TimelineElement } from "@/timeline";
import { mediaTimeFromSeconds, mediaTimeToSeconds, type MediaTime } from "@/wasm";

/**
 * ClipCut Phase 1 — transitions.
 *
 * The timeline model has no dedicated transition object, so a
 * transition is expressed with the editor's existing keyframe system:
 * the outgoing clip animates out over the last `duration` seconds and
 * the incoming clip animates in over its first `duration` seconds,
 * using only animatable paths (opacity / transform). Because the two
 * clips sit back-to-back on the same track, the result reads as a
 * fade / zoom / slide transition at the cut — the same trick
 * CapCut-style editors use for non-overlap transitions.
 */

export interface TransitionDefinition {
	id: string;
	name: string;
	description: string;
}

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
	{ id: "fade", name: "Fade", description: "Fade out, fade in" },
	{ id: "zoom-in", name: "Zoom In", description: "Next clip zooms in" },
	{ id: "zoom-out", name: "Zoom Out", description: "Next clip settles back" },
	{ id: "slide-left", name: "Slide Left", description: "Clips slide left" },
	{ id: "slide-up", name: "Slide Up", description: "Clips slide up" },
	{ id: "spin-in", name: "Spin In", description: "Next clip spins in" },
];

export interface TransitionKeyframe {
	trackId: string;
	elementId: string;
	propertyPath: string;
	time: MediaTime;
	value: number;
	interpolation: "linear";
}

function numParam({
	element,
	key,
	fallback,
}: {
	element: TimelineElement;
	key: string;
	fallback: number;
}): number {
	const raw = element.params?.[key];
	return typeof raw === "number" ? raw : fallback;
}

export function buildTransitionKeyframes({
	transitionId,
	trackId,
	outgoing,
	incoming,
	durationSeconds,
	canvasSize,
}: {
	transitionId: string;
	trackId: string;
	outgoing: TimelineElement;
	incoming: TimelineElement;
	durationSeconds: number;
	canvasSize: { width: number; height: number };
}): TransitionKeyframe[] {
	const outDuration = mediaTimeToSeconds({ time: outgoing.duration });
	const inDuration = mediaTimeToSeconds({ time: incoming.duration });
	const duration = Math.max(
		0.1,
		Math.min(durationSeconds, outDuration, inDuration),
	);

	const keyframes: TransitionKeyframe[] = [];
	const add = ({
		element,
		propertyPath,
		atSeconds,
		value,
	}: {
		element: TimelineElement;
		propertyPath: string;
		atSeconds: number;
		value: number;
	}) => {
		keyframes.push({
			trackId,
			elementId: element.id,
			propertyPath,
			time: mediaTimeFromSeconds({ seconds: atSeconds }),
			value,
			interpolation: "linear",
		});
	};

	const outOpacity = numParam({ element: outgoing, key: "opacity", fallback: 1 });
	const inOpacity = numParam({ element: incoming, key: "opacity", fallback: 1 });
	const outScaleX = numParam({ element: outgoing, key: "transform.scaleX", fallback: 1 });
	const outScaleY = numParam({ element: outgoing, key: "transform.scaleY", fallback: 1 });
	const inScaleX = numParam({ element: incoming, key: "transform.scaleX", fallback: 1 });
	const inScaleY = numParam({ element: incoming, key: "transform.scaleY", fallback: 1 });
	const inPosX = numParam({ element: incoming, key: "transform.positionX", fallback: 0 });
	const inPosY = numParam({ element: incoming, key: "transform.positionY", fallback: 0 });
	const outPosX = numParam({ element: outgoing, key: "transform.positionX", fallback: 0 });
	const outPosY = numParam({ element: outgoing, key: "transform.positionY", fallback: 0 });
	const inRotate = numParam({ element: incoming, key: "transform.rotate", fallback: 0 });

	const outStart = outDuration - duration;
	const fadeOut = () => {
		add({ element: outgoing, propertyPath: "opacity", atSeconds: outStart, value: outOpacity });
		add({ element: outgoing, propertyPath: "opacity", atSeconds: outDuration, value: 0 });
	};
	const fadeIn = () => {
		add({ element: incoming, propertyPath: "opacity", atSeconds: 0, value: 0 });
		add({ element: incoming, propertyPath: "opacity", atSeconds: duration, value: inOpacity });
	};

	switch (transitionId) {
		case "fade": {
			fadeOut();
			fadeIn();
			break;
		}
		case "zoom-in": {
			fadeOut();
			add({ element: outgoing, propertyPath: "transform.scaleX", atSeconds: outStart, value: outScaleX });
			add({ element: outgoing, propertyPath: "transform.scaleX", atSeconds: outDuration, value: outScaleX * 1.12 });
			add({ element: outgoing, propertyPath: "transform.scaleY", atSeconds: outStart, value: outScaleY });
			add({ element: outgoing, propertyPath: "transform.scaleY", atSeconds: outDuration, value: outScaleY * 1.12 });
			fadeIn();
			add({ element: incoming, propertyPath: "transform.scaleX", atSeconds: 0, value: inScaleX * 0.85 });
			add({ element: incoming, propertyPath: "transform.scaleX", atSeconds: duration, value: inScaleX });
			add({ element: incoming, propertyPath: "transform.scaleY", atSeconds: 0, value: inScaleY * 0.85 });
			add({ element: incoming, propertyPath: "transform.scaleY", atSeconds: duration, value: inScaleY });
			break;
		}
		case "zoom-out": {
			fadeOut();
			fadeIn();
			add({ element: incoming, propertyPath: "transform.scaleX", atSeconds: 0, value: inScaleX * 1.15 });
			add({ element: incoming, propertyPath: "transform.scaleX", atSeconds: duration, value: inScaleX });
			add({ element: incoming, propertyPath: "transform.scaleY", atSeconds: 0, value: inScaleY * 1.15 });
			add({ element: incoming, propertyPath: "transform.scaleY", atSeconds: duration, value: inScaleY });
			break;
		}
		case "slide-left": {
			add({ element: outgoing, propertyPath: "transform.positionX", atSeconds: outStart, value: outPosX });
			add({ element: outgoing, propertyPath: "transform.positionX", atSeconds: outDuration, value: outPosX - canvasSize.width });
			add({ element: incoming, propertyPath: "transform.positionX", atSeconds: 0, value: inPosX + canvasSize.width });
			add({ element: incoming, propertyPath: "transform.positionX", atSeconds: duration, value: inPosX });
			break;
		}
		case "slide-up": {
			add({ element: outgoing, propertyPath: "transform.positionY", atSeconds: outStart, value: outPosY });
			add({ element: outgoing, propertyPath: "transform.positionY", atSeconds: outDuration, value: outPosY - canvasSize.height });
			add({ element: incoming, propertyPath: "transform.positionY", atSeconds: 0, value: inPosY + canvasSize.height });
			add({ element: incoming, propertyPath: "transform.positionY", atSeconds: duration, value: inPosY });
			break;
		}
		case "spin-in": {
			fadeOut();
			fadeIn();
			add({ element: incoming, propertyPath: "transform.rotate", atSeconds: 0, value: inRotate - 15 });
			add({ element: incoming, propertyPath: "transform.rotate", atSeconds: duration, value: inRotate });
			add({ element: incoming, propertyPath: "transform.scaleX", atSeconds: 0, value: inScaleX * 0.9 });
			add({ element: incoming, propertyPath: "transform.scaleX", atSeconds: duration, value: inScaleX });
			add({ element: incoming, propertyPath: "transform.scaleY", atSeconds: 0, value: inScaleY * 0.9 });
			add({ element: incoming, propertyPath: "transform.scaleY", atSeconds: duration, value: inScaleY });
			break;
		}
		default: {
			fadeOut();
			fadeIn();
		}
	}

	return keyframes;
}

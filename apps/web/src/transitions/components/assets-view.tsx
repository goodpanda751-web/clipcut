"use client";

import { useState } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useEditor } from "@/editor/use-editor";
import { mediaTimeToSeconds } from "@/wasm";
import {
	TRANSITION_DEFINITIONS,
	buildTransitionKeyframes,
	type TransitionDefinition,
} from "@/transitions/definitions";
import { findNearestCut } from "@/transitions/find-cut";

const DURATION_OPTIONS = [
	{ value: "0.3", label: "0.3s" },
	{ value: "0.5", label: "0.5s" },
	{ value: "1", label: "1.0s" },
];

/**
 * ClipCut Phase 1 — Transitions panel.
 *
 * Applies a transition at the cut nearest to the playhead. The
 * transition is written as keyframes on the two clips either side of
 * the cut, so it can be undone, edited or deleted like any other
 * keyframe animation.
 */
export function TransitionsView() {
	const editor = useEditor();
	const [duration, setDuration] = useState("0.5");
	const [status, setStatus] = useState<string | null>(null);
	const [isError, setIsError] = useState(false);

	const applyTransition = ({
		transition,
	}: {
		transition: TransitionDefinition;
	}) => {
		const scene = editor.scenes.getActiveScene();
		const playheadTime = editor.playback.getCurrentTime();
		const cut = findNearestCut({ tracks: scene.tracks, playheadTime });

		if (!cut) {
			setIsError(true);
			setStatus(
				"No cut found. Put two clips next to each other on the timeline, move the playhead near where they meet, then tap a transition.",
			);
			return;
		}

		const canvasSize = editor.project.getActive().settings.canvasSize;
		const keyframes = buildTransitionKeyframes({
			transitionId: transition.id,
			trackId: cut.trackId,
			outgoing: cut.outgoing,
			incoming: cut.incoming,
			durationSeconds: Number.parseFloat(duration),
			canvasSize,
		});

		editor.timeline.upsertKeyframes({ keyframes });

		const cutSeconds = mediaTimeToSeconds({ time: cut.cutTime });
		setIsError(false);
		setStatus(
			`${transition.name} applied at ${formatTime({ seconds: cutSeconds })} — between “${cut.outgoing.name}” and “${cut.incoming.name}”. Undo works if you change your mind.`,
		);
	};

	return (
		<PanelView title="Transitions">
			<div className="flex items-center justify-between px-1 pb-3">
				<span className="text-muted-foreground text-xs">Duration</span>
				<Select value={duration} onValueChange={setDuration}>
					<SelectTrigger className="w-24">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DURATION_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<p className="text-muted-foreground px-1 pb-3 text-xs">
				Move the playhead near a cut between two clips, then tap a
				transition to apply it there.
			</p>
			<div
				className="grid gap-2"
				style={{
					gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
				}}
			>
				{TRANSITION_DEFINITIONS.map((transition) => (
					<button
						key={transition.id}
						type="button"
						onClick={() => applyTransition({ transition })}
						className="bg-secondary/40 hover:bg-secondary flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border p-2"
					>
						<span className="text-xs font-medium">{transition.name}</span>
						<span className="text-muted-foreground text-center text-[11px]">
							{transition.description}
						</span>
					</button>
				))}
			</div>
			{status && (
				<p
					className={
						isError
							? "text-destructive px-1 pt-3 text-xs"
							: "px-1 pt-3 text-xs"
					}
				>
					{status}
				</p>
			)}
		</PanelView>
	);
}

function formatTime({ seconds }: { seconds: number }): string {
	const total = Math.max(0, Math.round(seconds));
	const minutes = Math.floor(total / 60);
	const rest = total % 60;
	return `${minutes}:${String(rest).padStart(2, "0")}`;
}

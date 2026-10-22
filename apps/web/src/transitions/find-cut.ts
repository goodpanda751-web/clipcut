import type { SceneTracks, TimelineElement } from "@/timeline";
import { mediaTime, mediaTimeFromSeconds, type MediaTime } from "@/wasm";

const VISUAL_ELEMENT_TYPES = new Set([
	"video",
	"image",
	"text",
	"sticker",
	"graphic",
]);

export interface TimelineCut {
	trackId: string;
	outgoing: TimelineElement;
	incoming: TimelineElement;
	/** Timeline time of the cut (end of the outgoing clip), in ticks. */
	cutTime: MediaTime;
}

/**
 * Find the cut between two adjacent visual clips nearest to the
 * playhead, across the main track and overlay tracks. A pair counts
 * as a cut when the incoming clip starts within 0.3s of the outgoing
 * clip ending (a small gap or slight overlap is fine).
 */
export function findNearestCut({
	tracks,
	playheadTime,
}: {
	tracks: SceneTracks;
	playheadTime: MediaTime;
}): TimelineCut | null {
	const maxGap = mediaTimeFromSeconds({ seconds: 0.3 });
	const allTracks = [tracks.main, ...tracks.overlay];

	let best: TimelineCut | null = null;
	let bestDistance = Number.POSITIVE_INFINITY;

	for (const track of allTracks) {
		const visual = track.elements
			.filter((element) => VISUAL_ELEMENT_TYPES.has(element.type))
			.slice()
			.sort((a, b) => a.startTime - b.startTime);

		for (let i = 0; i + 1 < visual.length; i++) {
			const outgoing = visual[i];
			const incoming = visual[i + 1];
			const outEnd = outgoing.startTime + outgoing.duration;
			const gap = incoming.startTime - outEnd;
			if (gap > maxGap || gap < -maxGap) continue;

			const distance = Math.abs(outEnd - playheadTime);
			if (distance < bestDistance) {
				bestDistance = distance;
				best = {
					trackId: track.id,
					outgoing,
					incoming,
					cutTime: mediaTime({ ticks: outEnd }),
				};
			}
		}
	}

	return best;
}

<script lang="ts">
	import { useSpeechRecognition } from '$lib/speech/SpeechRecognition';
	import type { Command } from '$lib/speech/types';

	const toggleTranscribing = () => ($transcribing = !$transcribing);
	const toggleClearTranscriptOnListen = () =>
		($clearTranscriptOnListen = !$clearTranscriptOnListen);

	export let commands: Command[] = [];
	const {
		transcribing,
		clearTranscriptOnListen,
		resetTranscript,
		listening,
		browserSupportsSpeechRecognition,
		isMicrophoneAvailable,
		interimTranscript,
		finalTranscript
	} = useSpeechRecognition({
		transcribing: true,
		clearTranscriptOnListen: true,
		commands
	});

	$: console.log({ $finalTranscript });
</script>

{#if browserSupportsSpeechRecognition}
	{#if !isMicrophoneAvailable}
		<span>Please allow access to the microphone</span>
	{/if}

	<div style="display: 'flex'; flexDirection: 'column';">
		<div>
			<span>listening: {$listening ? 'on' : 'off'}</span>
			<span>transcribing: {$transcribing ? 'on' : 'off'}</span>
			<span>clearTranscriptOnListen: {$clearTranscriptOnListen ? 'on' : 'off'}</span>
		</div>
		<button on:click={resetTranscript}>Reset</button>
		<button on:click={toggleTranscribing}>Toggle transcribing</button>
		<button on:click={toggleClearTranscriptOnListen}>Toggle clearTranscriptOnListen</button>
		<span>Interim: {$interimTranscript}</span>
		<span>Final: {$finalTranscript}</span>
	</div>
{:else}
	<span>No browser support</span>
{/if}

<style>
	span {
		display: block;
	}
	button {
		width: 100%;
		border: 1px solid black;
	}
</style>

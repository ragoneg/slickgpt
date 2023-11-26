<script lang="ts">
	import { settingsStore } from '$misc/stores';
	import { Microphone, Stop } from '@inqling/svelte-icons/heroicon-24-solid';

	export let input: string;
	let mediaRecorder: MediaRecorder;
	let recordedAudio: BlobPart[] = [];
	let isRecording = false;
	let audioContext: AudioContext;
	let analyser: AnalyserNode;
	let dataArray: Uint8Array;
	let silenceTimer: NodeJS.Timeout | null | undefined;
	const min_decibel = -45; // in dB, adjust based on your needs
	const silenceTime = 2000; // time in ms to consider it as silence
	let bufferLength = 0;
	let requestOnGoing = false;
	async function startRecording() {
		if (!navigator.mediaDevices) {
			console.error('MediaDevices not supported in this browser.');
			return;
		}
		// Request permissions and start recording
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		analyser = audioContext.createAnalyser();
		analyser.minDecibels = min_decibel;
		source.connect(analyser);
		// analyser.fftSize = 2048;
		bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);

		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.addEventListener('dataavailable', (event) => {
			console.log(event);
			recordedAudio.push(event.data);
		});
		mediaRecorder.start();
		isRecording = true;

		// requestAnimationFrame(detectSound);
		monitorSilence();

		// Event to collect audio data

		// Event to save audio data when recording stops
		// mediaRecorder.addEventListener('stop', () => {
		// 	const audioBlob = new Blob(recordedAudio);
		// 	const audioUrl = URL.createObjectURL(audioBlob);
		// 	const audio = new Audio(audioUrl);
		// 	const audioFile = new File([audioBlob], 'recordedAudio.mp3', { type: 'audio/mpeg' });
		// 	transcribe(audioFile);
		// 	// audio.play();
		// });
	}
	function monitorSilence() {
		analyser.getByteFrequencyData(dataArray);

		// Calculate the average volume
		// const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
		// const averageDecibels = 20 * Math.log10(average / 255);
		let soundDetected = false;
		for (let i = 0; i < bufferLength; i++) {
			if (dataArray[i] > 0) {
				soundDetected = true;
				console.log('sound detected');
			}
		}
		// console.log(averageDecibels);

		if (!soundDetected) {
			// console.log('SILENCE');
			// If silence detected, start or keep running the timer
			if (!silenceTimer) {
				silenceTimer = setTimeout(() => {
					console.log('Silence detected for the specified duration');
					console.log(recordedAudio);
					mediaRecorder.stop();
					if (recordedAudio.length === 0) return;
					// Stop the recording or handle silence as needed
					const audioBlob = new Blob(recordedAudio);
					const audioUrl = URL.createObjectURL(audioBlob);
					// const audio = new Audio(audioUrl);
					recordedAudio = [];
					const audioFile = new File([audioBlob], 'recordedAudio.mp3', { type: 'audio/mpeg' });
					if (!requestOnGoing) transcribe(audioFile);
				}, silenceTime);
			}
		} else {
			// If not silent, clear the timer
			// console.log('VOICE');
			if (silenceTimer) clearTimeout(silenceTimer);
			silenceTimer = null;
		}

		// Keep monitoring
		requestAnimationFrame(monitorSilence);
	}
	async function transcribe(audioFile: File) {
		const formData = new FormData();
		formData.append('audioFile', audioFile);
		formData.append('apiKey', $settingsStore.openAiApiKey as string);
		requestOnGoing = true;
		console.time();
		const response = await fetch('/api/transcribe', {
			method: 'POST',
			body: formData
		});
		const { msg } = await response.json();
		input += msg;
		console.timeEnd();
		requestOnGoing = false;
	}

	function stopRecording() {
		if (mediaRecorder) {
			mediaRecorder.stop();
			isRecording = false;
		}
		audioContext.close();
		if (silenceTimer) clearTimeout(silenceTimer);
	}
	function toggleRecording() {
		if (isRecording) stopRecording();
		else startRecording();
	}
</script>

<button type="button" class="btn btn-sm ml-2" on:click={toggleRecording}>
	{#if isRecording}
		<Stop class="w-6 h-6 text-red-600" />
	{:else}
		<Microphone class="w-6 h-6" />
	{/if}
</button>

<script lang="ts">
	import { onMount } from 'svelte';
	import { settingsStore } from '$misc/stores';

	let mediaRecorder: MediaRecorder;
	let chunks: BlobPart[] = [];
	let isRecording = false;
	let recognition: SpeechRecognition;

	onMount(() => {
		if (!('mediaDevices' in navigator)) {
			console.error('MediaDevices API not supported.');
			return;
		}

		navigator.mediaDevices
			.getUserMedia({ audio: true })
			.then((stream) => {
				mediaRecorder = new MediaRecorder(stream);

				recognition = new webkitSpeechRecognition();
				recognition.lang = 'zh-CN';
				recognition.interimResults = false;
				recognition.maxAlternatives = 1;

				recognition.onresult = (event) => {
					const last = event.results.length - 1;
					const result = event.results[last][0].transcript;

					if (event.results[last].isFinal) {
						console.log(`You said: ${result}`);
						stopRecording();
					}
				};

				recognition.onspeechend = () => {
					console.log('Speech ended');
					stopRecording();
				};

				recognition.onerror = (event) => {
					console.error(`Error occurred in recognition: ${event.error}`);
				};

				mediaRecorder.addEventListener('dataavailable', (event) => {
					chunks.push(event.data);
				});

				mediaRecorder.addEventListener('stop', () => {
					sendAudio();
				});
			})
			.catch((err) => {
				console.error('An error occurred: ' + err);
			});
	});

	function startRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'recording') {
			mediaRecorder.start();
			isRecording = true;
			recognition.start();
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			mediaRecorder.stop();
			isRecording = false;
			recognition.stop();
		}
	}

	function sendAudio() {
		if (chunks.length > 0) {
			const audioFile = new File(chunks, 'recordedAudio.mp3', { type: 'audio/mpeg' });
			chunks = [];

			const formData = new FormData();
			formData.append('audioFile', audioFile);
			formData.append('apiKey', $settingsStore.openAiApiKey as string);

			fetch('/api/transcribe', {
				method: 'POST',
				body: formData
			})
				.then((response) => {
					if (response.ok) {
						console.log('Audio sent successfully');
					} else {
						console.error('Failed to send audio');
					}
				})
				.catch((err) => {
					console.error('An error occurred: ' + err);
				});
		}
	}
</script>

<button on:click={isRecording ? stopRecording : startRecording}>
	{isRecording ? 'Stop Recording' : 'Start Recording'}
</button>

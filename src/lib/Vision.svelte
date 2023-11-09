<script lang="ts">
	import { liveAnswerStore, settingsStore } from '$misc/stores';
	import { CloudArrowUp, Document } from '@inqling/svelte-icons/heroicon-24-solid';
	import { createEventDispatcher } from 'svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import { writable } from 'svelte/store';
	export let input: string;
	let files: FileList, inputFile: HTMLInputElement;
	let imageUrl: string;
	const dispatch = createEventDispatcher();
	let selectedFile: File;
	const isLoading = writable(false);

	const handleFileChange = (event: any) => {
		console.log(event);
		selectedFile = event.target.files[0];
		imageUrl = URL.createObjectURL(selectedFile);
	};
	const openFilePicker = () => {
		inputFile.click();
	};
	async function uploadFile() {
		isLoading.set(true);
		// const file = files[0];
		const base64 = await toBase64(selectedFile);

		const response = await fetch('/api/vision', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ imageFile: base64, apiKey: $settingsStore.openAiApiKey, text: input })
		});
		const { msg } = await response.json();
		console.log('upload', msg.choices[0].message.content);
		// $liveAnswerStore.content = msg.choices[0].message.content;
		dispatch('visionMsgReturned', { text: msg.choices[0].message.content });
		// await new Promise((resolve) => setTimeout(resolve, 2000));

		isLoading.set(false);

		// if (!response.ok) {
		// 	console.error('Upload failed:', response);
		// }
	}

	function toBase64(file: File) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	}
</script>

<div>
	<!-- <input hidden type="file" bind:files id="file" on:change={handleFileChange} accept="image/*" /> -->
	<input
		type="file"
		id="file"
		on:change={handleFileChange}
		accept="image/*"
		bind:this={inputFile}
		style="display: none"
	/>

	{#if selectedFile}
		<button on:click={uploadFile} disabled={$isLoading || input.length === 0}>
			<CloudArrowUp disabled isLoading={$isLoading} class="w-6 h-6" />
		</button>
	{:else}
		<button on:click|preventDefault={openFilePicker} disabled={$isLoading}>
			<Document class="w-6 h-6" />
		</button>
	{/if}
	{#if imageUrl}
		<img src={imageUrl} alt="Preview" class="avatar" />
	{/if}
</div>

<style>
	.avatar {
		width: 32px;
	}
</style>

<script lang="ts">
	import { CloudArrowUp, Document } from '@inqling/svelte-icons/heroicon-24-solid';
	import { createEventDispatcher } from 'svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import { writable } from 'svelte/store';

	export let imageUrl: string | undefined, selectedFile: File | undefined;

	let inputFile: HTMLInputElement;
	const isLoading = writable(false);

	const handleFileChange = (event: any) => {
		selectedFile = event.target.files[0];
		if (selectedFile) {
			imageUrl = URL.createObjectURL(selectedFile);
		}
	};

	const openFilePicker = () => {
		inputFile.click();
	};
</script>

<div>
	<input
		type="file"
		id="file"
		on:change={handleFileChange}
		accept="image/*"
		bind:this={inputFile}
		style="display: none"
	/>

	{#if imageUrl}
		<img src={imageUrl} alt="Preview" class="avatar" />
	{:else}
		<button on:click|preventDefault={openFilePicker} disabled={$isLoading}>
			<Document class="w-6 h-6" />
		</button>
	{/if}
</div>

<style>
	.avatar {
		width: 32px;
	}
</style>

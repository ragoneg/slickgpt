<script lang="ts">
	import { settingsStore } from '$misc/stores';
	import { Document, Sparkles } from '@inqling/svelte-icons/heroicon-24-solid';

	let prompt = '';
	let image: string;
	export let input: string;
	async function generateImage() {
		const response = await fetch('/api/imageGeneration', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ msg: input, apiKey: $settingsStore.openAiApiKey })
		});
		const data = await response.json();
		console.log(data);
		image = data[0].url;
		prompt = data[0].revised_prompt;
	}
</script>

<button disabled={input.length === 0} on:click={generateImage}>
	<Sparkles class="w-6 h-6" />
</button>
{#if image}
	<img src={image} alt={prompt} />
{/if}

<style>
</style>

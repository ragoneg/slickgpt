<script lang="ts">
	import { settingsStore } from '$misc/stores';
	import { stringify } from 'postcss';
	import { beforeUpdate, onMount } from 'svelte';
	let messages = [] as { source: string; target: string }[];
	let tempMsg = undefined as undefined | string;
	let source = 'zh-CN';
	let target = 'en-US';
	let div: HTMLElement | null | undefined;
	let autoscroll: boolean | null | undefined;
	onMount(() => {
		// bind to the *scrollable* element by it's id
		div = document.getElementById('scrollBottom');
		// const texts = document.querySelector('.texts') as HTMLElement;
		const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

		const recognition = new SpeechRecognition();
		recognition.lang = source;
		recognition.interimResults = true;
		console.log(recognition);

		let p = document.createElement('p');

		recognition.addEventListener(
			'result',
			({ results }: { results: SpeechRecognitionResultList }) => {
				// texts.appendChild(p);
				const text = Array.from(results)
					.map((result) => result[0])
					.map((result) => result.transcript)
					.join('');

				// p.innerText = text;
				if (results[0].isFinal) {
					if (text.includes('How are you')) {
						p = document.createElement('p');
						p.classList.add('replay');
						p.innerText = 'I am fine';
						// texts.appendChild(p);
					}
					if (text.includes("what's your name") || text.includes('what is your name')) {
						p = document.createElement('p');
						p.classList.add('replay');
						p.innerText = 'My Name is Cifar';
						// texts.appendChild(p);
					}
					if (text.includes('open my YouTube')) {
						p = document.createElement('p');
						p.classList.add('replay');
						p.innerText = 'opening youtube channel';
						// texts.appendChild(p);
						console.log('opening youtube');
						window.open('https://www.youtube.com/channel/UCdxaLo9ALJgXgOUDURRPGiQ');
					}
					messages = [...messages, { source: text, target: text }];
					tempMsg = undefined;
					// p = document.createElement('p');
					translate(text).then((translation) => {
						// 	let p1 = document.createElement('p');
						// 	p1.classList.add('replay');
						// 	p1.innerText = translation;
						// 	texts.appendChild(p1);
						messages = messages.map((t) =>
							t.source === text ? { source: text, target: translation } : t
						);
						div?.scrollTo({ top: div.scrollHeight, behavior: 'smooth' });
					});
				} else {
					tempMsg = text;
				}
			}
		);

		recognition.addEventListener('end', () => {
			recognition.start();
		});

		recognition.start();
	});
	async function translate(text: string) {
		const data = await fetch('/api/translation', {
			method: 'POST',
			body: JSON.stringify({ text, apiKey: $settingsStore.openAiApiKey })
		});
		const { translation } = await data.json();
		return translation;
	}

	beforeUpdate(() => {
		autoscroll = div && div.offsetHeight + div.scrollTop > div.scrollHeight - 20;
	});
</script>

<section>
	<h1>Speech<br /> Recognition</h1>
	<div class="container" id="scrollBottom">
		<div class="texts">
			{#each messages as { source, target }}
				<p>
					{source}
				</p>
				<p class="replay">{target}</p>
			{/each}
			{#if tempMsg}
				<p>{tempMsg}</p>
			{/if}
		</div>
	</div>
</section>

<style lang="css">
	* {
		padding: 0;
		margin: 0;
		box-sizing: border-box;
	}
	html {
		font-family: 'Montserrat';
		font-size: 20px;
	}
	section {
		min-height: 100vh;
		width: 100%;
		display: flex;
		align-items: flex-start;
		background-color: rgb(37, 37, 37);
		flex-direction: column;
		padding: 50px 0;
	}
	section h1 {
		color: rgba(255, 255, 255, 0.322);
		text-align: center;
		width: 100%;
		font-size: 50px;
		margin-bottom: 10px;
	}
	section p {
		text-align: center;
		color: rgba(255, 255, 255, 0.322);
		width: 100%;
		margin-bottom: 40px;
	}
	.container {
		width: 90%;
		max-width: 500px;
		margin: 0 auto;
		justify-content: center;
		max-height: 800px;
		overflow-y: scroll;
	}
	.texts p {
		color: black;
		text-align: left;
		width: 100%;
		background-color: white;
		padding: 10px;
		border-radius: 8px;
		margin-bottom: 10px;
	}
	.texts p.replay {
		text-align: right;
		margin-bottom: 20px;
	}
</style>

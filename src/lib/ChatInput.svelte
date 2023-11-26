<script lang="ts">
	import type { ChatCompletionMessageParam } from 'openai/resources/chat';
	import { onDestroy, onMount, tick } from 'svelte';
	import { messagesStore, textareaAutosizeAction } from 'svelte-legos';
	import {
		LightSwitch,
		SlideToggle,
		focusTrap,
		getModalStore,
		getToastStore
	} from '@skeletonlabs/skeleton';
	import {
		CodeBracket,
		PaperAirplane,
		CircleStack,
		Sparkles,
		QueueList
	} from '@inqling/svelte-icons/heroicon-24-solid';
	import {
		type ChatCost,
		type ChatMessage,
		showModalComponent,
		showToast,
		track
	} from '$misc/shared';
	import {
		chatStore,
		eventSourceStore,
		isLoadingAnswerStore,
		liveAnswerStore,
		enhancedLiveAnswerStore,
		settingsStore
	} from '$misc/stores';
	import { OpenAiModel, countTokens } from '$misc/openai';
	import Record from './Record.svelte';
	import Vision from './Vision.svelte';
	import { ChatCompletionStream } from 'openai/lib/ChatCompletionStream';
	import Record2 from './Record2.svelte';
	export let slug: string;
	export let chatCost: ChatCost | null;

	let debounceTimer: number | undefined;
	let input = '';
	let inputCopy = '';
	let textarea: HTMLTextAreaElement;
	let messageTokens = 0;
	let lastUserMessage: ChatMessage | null = null;
	let currentMessages: ChatMessage[] | null = null;

	let isEditMode = false;
	let originalMessage: ChatMessage | null = null;

	let voiceOn = false;
	let imageUrl: string | undefined, selectedFile: File | undefined;

	const modalStore = getModalStore();
	const toastStore = getToastStore();

	$: chat = $chatStore[slug];
	$: message = {
		role: 'user',
		content: input.trim()
	} as ChatCompletionMessageParam;

	const unsubscribe = chatStore.subscribe((chats) => {
		const chat = chats[slug];
		if (chat) {
			currentMessages = chatStore.getCurrentMessageBranch(chat);
		}
	});

	onDestroy(unsubscribe);

	let tokensLeft = -1;
	$: {
		tokensLeft = chatCost
			? chatCost.maxTokensForModel - (chatCost.tokensTotal + messageTokens)
			: -1;
	}
	$: maxTokensCompletion = chat.settings.max_tokens;
	// $: showTokenWarning = maxTokensCompletion > tokensLeft;

	async function handleSubmit() {
		isLoadingAnswerStore.set(true);
		inputCopy = input;

		let parent: ChatMessage | null = null;
		if (currentMessages && currentMessages.length > 0) {
			parent = chatStore.getMessageById(currentMessages[currentMessages.length - 1].id!, chat);
		}

		if (!isEditMode) {
			chatStore.addMessageToChat(slug, message, parent || undefined);
			track('ask');
		} else if (originalMessage && originalMessage.id) {
			chatStore.addAsSibling(slug, originalMessage.id, message);
			track('edit');
		}

		// message now has an id
		lastUserMessage = message;

		const payload = {
			// OpenAI API complains if we send additionale props
			messages: currentMessages?.map(
				(m) =>
					({
						role: m.role,
						content: m.content,
						name: m.name
					}) as ChatCompletionMessageParam
			),
			settings: chat.settings,
			openAiKey: $settingsStore.openAiApiKey
		};
		if (input.startsWith('image')) {
			input = input.replace('image', '');
			generateImage().then((html) => {
				$liveAnswerStore.content = html;
				addCompletionToChat();
			});
		} else if (!imageUrl) {
			// if (imageUrl && selectedFile) {
			// 	const base64 = (await toBase64(selectedFile)) as string;
			// 	payload.settings.model = 'gpt-4-vision-preview' as OpenAiModel;
			// 	if (payload.messages && payload.messages?.length > 0 && payload.messages.at(-1)?.content) {
			// 		const lastMessage = payload.messages.at(-1);
			// 		if (lastMessage?.content) {
			// 			lastMessage.content = [
			// 				{ type: 'text', text: lastMessage.content },
			// 				{ type: 'image_url', image_url: { url: base64 } }
			// 			] as any[];
			// 		}
			// 	}
			// 	console.log(payload);
			// }
			const res = await fetch('/api/ask', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});
			const runner = ChatCompletionStream.fromReadableStream(res.body!);
			runner.on('content', (delta, snapshot) => {
				// console.log(delta);
				liveAnswerStore.update((store) => {
					const answer = { ...store };
					answer.content += delta;
					return answer;
				});
				// process..stdout.write(delta);
				// or, in a browser, you might display like this:
				// document.body.innerText += delta; // or:
				// document.body.innerText = snapshot;
			});
			runner.on('finalMessage', (message) => addCompletionToChat());
			// runner.on('chatCompletion', (snaphost) => {
			// 	console.log('ChatCompletion', snaphost);
			// });
			// runner.on('finalContent', (contentSnapshot) => addCompletionToChat());

			// $eventSourceStore.start(payload, handleAnswer, handleError, handleAbort);
		} else {
			uploadFile(input).then((text) => {
				if (text) {
					console.log(text);
					$liveAnswerStore.content = text;
					addCompletionToChat();
				}
			});
		}
		input = '';
	}
	async function clearContext() {
		chatStore.updateChat(slug, { ...chat, messages: [] });
	}
	function handleAnswer(event: MessageEvent<any>) {
		try {
			// streaming...
			if (event.data !== '[DONE]') {
				// todo What's the correct type for this? It's not CreateChatCompletionResponse... maybe still missing in TypeDefs?
				const completionResponse: any = JSON.parse(event.data);
				const delta = completionResponse.choices[0].delta.content || '';
				liveAnswerStore.update((store) => {
					const answer = { ...store };
					answer.content += delta;
					return answer;
				});
			}
			// streaming completed
			else {
				addCompletionToChat();
			}
		} catch (err) {
			handleError(err);
		}
	}

	function handleAbort(_event: MessageEvent<any>) {
		// th message we're adding is incomplete, so HLJS probably can't highlight it correctly
		addCompletionToChat(true);
	}

	function handleError(event: any) {
		$eventSourceStore.reset();
		$isLoadingAnswerStore = false;

		// always true, check just for TypeScript
		if (lastUserMessage?.id) {
			chatStore.deleteMessage(slug, lastUserMessage.id);
		}

		console.error(event);

		const data = JSON.parse(event.data);

		showToast(toastStore, data.message || 'An error occured.', 'error');

		if (data.message.includes('API key')) {
			showModalComponent(modalStore, 'SettingsModal', { slug });
		}

		// restore last user prompt
		input = inputCopy;
	}

	function addCompletionToChat(isAborted = false) {
		const messageToAdd: ChatMessage = !isAborted
			? { ...$liveAnswerStore }
			: { ...$enhancedLiveAnswerStore, isAborted: true };

		chatStore.addMessageToChat(slug, messageToAdd, lastUserMessage || undefined);
		$isLoadingAnswerStore = false;

		$eventSourceStore.reset();
		resetLiveAnswer();
		lastUserMessage = null;
		cancelEditMessage();
		// console.log('message', messageToAdd);
		if (voiceOn) {
			speak(messageToAdd.content);
		}
	}

	function resetLiveAnswer() {
		liveAnswerStore.update((store) => {
			const answer = { ...store };
			answer.content = '';
			return answer;
		});
	}

	function handleKeyDown(event: KeyboardEvent) {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(calculateMessageTokens, 750);

		if ($isLoadingAnswerStore) {
			return;
		}

		if (event.key === 'Enter' && !event.shiftKey) {
			handleSubmit();
		}
	}

	function calculateMessageTokens() {
		messageTokens = countTokens(message);
		clearTimeout(debounceTimer);
		debounceTimer = undefined;
	}

	function openTokenCostDialog() {
		calculateMessageTokens();
		showModalComponent(modalStore, 'CostModal', { chatCost, maxTokensCompletion, messageTokens });
	}

	async function handleInsertCode() {
		input += '\n```\n\n```';

		// tick is required for the action to resize the textarea
		await tick();
		textareaAutosizeAction(textarea);

		calculateMessageTokens();
	}

	export async function editMessage(message: ChatMessage) {
		originalMessage = message;
		input = message.content;
		isEditMode = true;

		// tick is required for the action to resize the textarea
		await tick();
		textareaAutosizeAction(textarea);
	}

	async function cancelEditMessage() {
		isEditMode = false;
		originalMessage = null;
		input = '';

		// tick is required for the action to resize the textarea
		await tick();
		textareaAutosizeAction(textarea);
	}

	async function speak(input: string) {
		const audio = new Audio();
		$isLoadingAnswerStore = true;
		const response = await fetch('/api/speak', {
			method: 'POST',
			body: JSON.stringify({ apiKey: $settingsStore.openAiApiKey, input })
		});
		if (!response.body) return;
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		audio.src = url;
		audio.play();
		$isLoadingAnswerStore = false;
	}
	function toBase64(file: File) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result);
			reader.onerror = (error) => reject(error);
		});
	}
	async function uploadFile(text: string) {
		if (!selectedFile) return;
		const base64 = await toBase64(selectedFile);
		// await new Promise((resolve) => setTimeout(resolve, 5000));

		const _response = await fetch('/api/vision', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ imageFile: base64, apiKey: $settingsStore.openAiApiKey, text })
		});
		const { msg } = await _response.json();
		const _msg = msg.choices[0].message.content;
		const imgTag = `<img src="${imageUrl}" alt="${_msg}" />`;
		selectedFile = undefined;
		imageUrl = undefined;
		return `${imgTag}${_msg}`;
	}
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
		// imageGeneratedUrl = data[0].url;
		// promptImageGenereted = data[0].revised_prompt;
		return `<img src="${data[0].url}" alt="${data[0].revised_prompt}" />`;
	}
</script>

<footer
	class="sticky card space-y-4 bottom-0 z-10 variant-filled-surface-700 py-2 md:py-4 md:px-8 md:rounded-xl"
>
	{#if $isLoadingAnswerStore}
		<div class="flex items-center justify-center">
			<button class="btn variant-ghost w-48 self-center" on:click={() => $eventSourceStore.stop()}>
				Cancel generating
			</button>
		</div>
	{:else}
		<div class="flex flex-col space-y-2 md:mx-auto md:w-3/4 px-2 md:px-8">
			{#if isEditMode}
				<div class="flex items-center justify-between">
					<p>Editing creates a <span class="italic">chat branch</span>.</p>
					<button class="btn btn-sm" on:click={cancelEditMessage}>
						<span>Cancel</span>
					</button>
				</div>
			{/if}
			<div class="flex items-center justify-end space-x-5">
				<button on:click={clearContext}>
					<QueueList class="w-6 h-6" />
				</button>
				<!-- <Record bind:input /> -->
				<Record2 />
				<SlideToggle name="Voice" label="Voice" bind:checked={voiceOn} />
				<Vision bind:selectedFile bind:imageUrl />
			</div>
			<div class="grid">
				<form use:focusTrap={!$isLoadingAnswerStore} on:submit|preventDefault={handleSubmit}>
					<div class="grid grid-cols-[1fr_auto]">
						<!-- Input -->
						<textarea
							class="textarea overflow-hidden min-h-[42px]"
							rows="1"
							placeholder="Enter to send, Shift+Enter for newline"
							use:textareaAutosizeAction
							on:keydown={handleKeyDown}
							bind:value={input}
							bind:this={textarea}
						/>
						<div class="flex flex-col md:flex-row items-center justify-end md:items-end">
							<!-- Insert Code button -->
							<button
								type="submit"
								class="btn btn-sm ml-2"
								on:click|preventDefault={handleInsertCode}
							>
								<CodeBracket class="w-6 h-6" />
							</button>
							<!-- Send button -->
							<button type="submit" class="btn btn-sm ml-2">
								<PaperAirplane class="w-6 h-6" />
							</button>
						</div>
					</div>
				</form>
			</div>
			<!-- Tokens -->
			{#if input.length > 0}
				<button
					class="flex items-center text-xs text-slate-500 dark:text-slate-200 ml-4 space-x-1"
					class:animate-pulse={!!debounceTimer}
					on:click={openTokenCostDialog}
				>
					<span>{tokensLeft} tokens left</span>
					<CircleStack class="w-6 h-6" />
				</button>
			{/if}
		</div>
	{/if}
</footer>

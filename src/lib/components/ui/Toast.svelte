<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';

	export let type: 'success' | 'error' | 'warning' | 'info' = 'info';
	export let message: string;
	export let duration: number = 4000;
	export let onClose: (() => void) | null = null;
	export let persistent: boolean = false;

	let visible = true;
	let timeoutId: number;

	const typeConfig = {
		success: {
			icon: 'M5 13l4 4L19 7',
			bgColor: 'bg-success-50',
			borderColor: 'border-success-200',
			textColor: 'text-success-800',
			iconColor: 'text-success-600'
		},
		error: {
			icon: 'M6 18L18 6M6 6l12 12',
			bgColor: 'bg-red-50',
			borderColor: 'border-red-200',
			textColor: 'text-red-800',
			iconColor: 'text-red-600'
		},
		warning: {
			icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
			bgColor: 'bg-yellow-50',
			borderColor: 'border-yellow-200',
			textColor: 'text-yellow-800',
			iconColor: 'text-yellow-600'
		},
		info: {
			icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			bgColor: 'bg-blue-50',
			borderColor: 'border-blue-200',
			textColor: 'text-blue-800',
			iconColor: 'text-blue-600'
		}
	};

	function close() {
		visible = false;
		if (onClose) {
			onClose();
		}
	}

	onMount(() => {
		if (!persistent && duration > 0) {
			timeoutId = setTimeout(close, duration);
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	});

	$: config = typeConfig[type];
</script>

{#if visible}
	<div 
		class="flex items-center p-4 rounded-lg border {config.bgColor} {config.borderColor} shadow-medium max-w-sm"
		transition:fade={{ duration: 300 }}
		role="alert"
	>
		<div class="flex-shrink-0">
			<svg class="h-5 w-5 {config.iconColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={config.icon} />
			</svg>
		</div>
		<div class="ml-3 flex-1 {config.textColor}">
			<p class="text-sm font-medium">{message}</p>
		</div>
		<div class="ml-4">
			<button 
				on:click={close}
				class="inline-flex rounded-md p-1.5 {config.textColor} hover:bg-opacity-20 hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-neutral-600"
			>
				<span class="sr-only">Dismiss</span>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
{/if} 
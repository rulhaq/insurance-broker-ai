<script lang="ts">
	import { onMount } from 'svelte';

	export let fallback: string = 'Something went wrong';
	
	let hasError = false;
	let errorMessage = '';

	onMount(() => {
		const handleError = (event: ErrorEvent) => {
			hasError = true;
			errorMessage = event.error?.message || 'An unexpected error occurred';
			console.error('Error caught by ErrorBoundary:', event.error);
		};

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			hasError = true;
			errorMessage = event.reason?.message || 'An unexpected error occurred';
			console.error('Promise rejection caught by ErrorBoundary:', event.reason);
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleUnhandledRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		};
	});

	function retry() {
		hasError = false;
		errorMessage = '';
		window.location.reload();
	}
</script>

{#if hasError}
	<div class="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
		<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
			<div class="mb-4">
				<svg class="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
				</svg>
			</div>
			<h1 class="text-xl font-semibold text-neutral-900 mb-2">Oops! Something went wrong</h1>
			<p class="text-neutral-600 mb-6">{errorMessage || fallback}</p>
			<div class="space-y-3">
				<button 
					on:click={retry}
					class="btn btn-primary btn-md w-full"
				>
					Try Again
				</button>
				<button 
					on:click={() => window.location.href = '/'}
					class="btn btn-secondary btn-md w-full"
				>
					Go Home
				</button>
			</div>
		</div>
	</div>
{:else}
	<slot />
{/if} 
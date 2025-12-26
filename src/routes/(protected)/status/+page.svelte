<script lang="ts">
	import { onMount } from 'svelte';
	import { getChatAssistance } from '$lib/services/groq';
	import { currentUser } from '$lib/services/auth';

	let testMessage = 'Hello, can you help me with insurance?';
	let response = '';
	let isLoading = false;
	let error = '';

	async function testAI() {
		isLoading = true;
		error = '';
		response = '';

		try {
			const context = {
				userRole: $currentUser?.role || 'customer',
				userId: $currentUser?.uid || 'test-user'
			};

			response = await getChatAssistance(testMessage, context);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="p-6">
	<h1 class="text-2xl font-bold mb-6">AI System Status</h1>

	<div class="space-y-6">
		<!-- User Info -->
		<div class="bg-white rounded-lg border p-4">
			<h2 class="text-lg font-semibold mb-2">Current User</h2>
			<p><strong>Role:</strong> {$currentUser?.role || 'Not logged in'}</p>
			<p><strong>Email:</strong> {$currentUser?.email || 'N/A'}</p>
		</div>

		<!-- AI Test -->
		<div class="bg-white rounded-lg border p-4">
			<h2 class="text-lg font-semibold mb-4">AI Response Test</h2>
			
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium mb-2">Test Message:</label>
					<input 
						bind:value={testMessage}
						class="w-full border rounded px-3 py-2"
						placeholder="Enter test message"
					/>
				</div>

				<button 
					on:click={testAI}
					disabled={isLoading}
					class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
				>
					{isLoading ? 'Testing...' : 'Test AI Response'}
				</button>

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
						<strong>Error:</strong> {error}
					</div>
				{/if}

				{#if response}
					<div class="bg-green-50 border border-green-200 p-4 rounded">
						<h3 class="font-semibold mb-2">AI Response:</h3>
						<div class="whitespace-pre-wrap">{response}</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Console Instructions -->
		<div class="bg-blue-50 border border-blue-200 p-4 rounded">
			<h3 class="font-semibold mb-2">Debug Instructions:</h3>
			<ol class="list-decimal list-inside space-y-1 text-sm">
				<li>Open browser developer tools (F12)</li>
				<li>Go to Console tab</li>
				<li>Click "Test AI Response" button</li>
				<li>Check console for debug messages like:</li>
				<ul class="list-disc list-inside ml-4 mt-2">
					<li>🔧 Groq AI Service Initialized</li>
					<li>🔑 API Key Status: Missing/Available</li>
					<li>🎯 Chat Request: ...</li>
					<li>🤖 Using fallback response (no API key)</li>
				</ul>
			</ol>
		</div>

		<!-- Environment Setup -->
		<div class="bg-yellow-50 border border-yellow-200 p-4 rounded">
			<h3 class="font-semibold mb-2">To Enable Real Groq AI:</h3>
			<ol class="list-decimal list-inside space-y-1 text-sm">
				<li>Get API key from <a href="https://console.groq.com/" target="_blank" class="text-blue-600 underline">https://console.groq.com/</a></li>
				<li>Create <code class="bg-gray-100 px-1 rounded">.env</code> file in project root</li>
				<li>Add: <code class="bg-gray-100 px-1 rounded">VITE_GROQ_API_KEY=your_api_key_here</code></li>
				<li>Restart dev server: <code class="bg-gray-100 px-1 rounded">npm run dev</code></li>
			</ol>
		</div>
	</div>
</div> 
<script lang="ts">
	import { onMount } from 'svelte';
	import { collection, getDocs } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import { currentUser } from '$lib/services/auth';

	let clientCount = 0;
	let quoteCount = 0;
	let policyCount = 0;
	let taskCount = 0;
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadCounts();
	});

	async function loadCounts() {
		try {
			console.log('Current user:', $currentUser);
			
			// Get counts for each collection
			const clientsSnapshot = await getDocs(collection(db, 'clients'));
			clientCount = clientsSnapshot.size;
			console.log('Clients found:', clientCount);

			const quotesSnapshot = await getDocs(collection(db, 'quotes'));
			quoteCount = quotesSnapshot.size;
			console.log('Quotes found:', quoteCount);

			const policiesSnapshot = await getDocs(collection(db, 'policies'));
			policyCount = policiesSnapshot.size;
			console.log('Policies found:', policyCount);

			const tasksSnapshot = await getDocs(collection(db, 'tasks'));
			taskCount = tasksSnapshot.size;
			console.log('Tasks found:', taskCount);

			// Log some sample data
			if (clientsSnapshot.size > 0) {
				const firstClient = clientsSnapshot.docs[0].data();
				console.log('Sample client:', firstClient);
			}

			if (policiesSnapshot.size > 0) {
				const firstPolicy = policiesSnapshot.docs[0].data();
				console.log('Sample policy:', firstPolicy);
			}

		} catch (err) {
			console.error('Error loading data:', err);
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="p-6 bg-white rounded-lg border border-neutral-200">
	<h3 class="text-lg font-semibold mb-4">Firebase Data Test</h3>
	
	{#if loading}
		<p>Loading data...</p>
	{:else if error}
		<p class="text-red-600">Error: {error}</p>
	{:else}
		<div class="grid grid-cols-2 gap-4">
			<div class="text-center p-4 bg-blue-50 rounded">
				<div class="text-2xl font-bold text-blue-600">{clientCount}</div>
				<div class="text-sm text-blue-800">Clients</div>
			</div>
			<div class="text-center p-4 bg-green-50 rounded">
				<div class="text-2xl font-bold text-green-600">{quoteCount}</div>
				<div class="text-sm text-green-800">Quotes</div>
			</div>
			<div class="text-center p-4 bg-purple-50 rounded">
				<div class="text-2xl font-bold text-purple-600">{policyCount}</div>
				<div class="text-sm text-purple-800">Policies</div>
			</div>
			<div class="text-center p-4 bg-yellow-50 rounded">
				<div class="text-2xl font-bold text-yellow-600">{taskCount}</div>
				<div class="text-sm text-yellow-800">Tasks</div>
			</div>
		</div>
		
		<div class="mt-4 text-sm text-neutral-600">
			<p><strong>Current User:</strong> {$currentUser?.email || 'Not logged in'}</p>
			<p><strong>User Role:</strong> {$currentUser?.role || 'Unknown'}</p>
			<p><strong>User ID:</strong> {$currentUser?.uid || 'Unknown'}</p>
		</div>
	{/if}
</div> 
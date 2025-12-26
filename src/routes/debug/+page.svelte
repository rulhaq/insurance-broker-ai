<script lang="ts">
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/services/auth';
	import { collection, getDocs } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';

	let debugInfo = {
		currentUser: null,
		allClients: [],
		allUsers: [],
		loading: true
	};

	onMount(async () => {
		await loadDebugData();
	});

	async function loadDebugData() {
		try {
			debugInfo.loading = true;
			
			// Get current user
			debugInfo.currentUser = $currentUser;
			
			// Get all clients
			const clientsSnapshot = await getDocs(collection(db, 'clients'));
			debugInfo.allClients = clientsSnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));
			
			// Get all users
			const usersSnapshot = await getDocs(collection(db, 'users'));
			debugInfo.allUsers = usersSnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			}));
			
		} catch (error) {
			console.error('Debug error:', error);
		} finally {
			debugInfo.loading = false;
		}
	}
</script>

<svelte:head>
	<title>Debug - Insurance Broker Pro</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6">
	<h1 class="text-3xl font-bold mb-6">🔍 Debug Information</h1>
	
	{#if debugInfo.loading}
		<div class="text-center py-8">
			<p>Loading debug information...</p>
		</div>
	{:else}
		<!-- Current User -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">👤 Current User</h2>
			{#if debugInfo.currentUser}
				<div class="bg-gray-50 p-4 rounded">
					<pre>{JSON.stringify(debugInfo.currentUser, null, 2)}</pre>
				</div>
			{:else}
				<p class="text-red-600">No user logged in</p>
			{/if}
		</div>

		<!-- All Users -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">👥 All Users in Firebase ({debugInfo.allUsers.length})</h2>
			{#each debugInfo.allUsers as user}
				<div class="bg-gray-50 p-4 rounded mb-4">
					<div class="font-semibold">ID: {user.id}</div>
					<div>Email: {user.email}</div>
					<div>Role: {user.role}</div>
					<div>Name: {user.firstName} {user.lastName}</div>
				</div>
			{/each}
		</div>

		<!-- All Clients -->
		<div class="bg-white rounded-lg shadow p-6 mb-6">
			<h2 class="text-xl font-semibold mb-4">👥 All Clients in Firebase ({debugInfo.allClients.length})</h2>
			{#each debugInfo.allClients as client}
				<div class="bg-gray-50 p-4 rounded mb-4">
					<div class="font-semibold">Client ID: {client.id}</div>
					<div>Name: {client.firstName} {client.lastName}</div>
					<div>Email: {client.email}</div>
					<div class="text-blue-600">Broker ID: {client.brokerId}</div>
					<div>Status: {client.status}</div>
					{#if debugInfo.currentUser}
						<div class="mt-2 p-2 bg-yellow-100 rounded">
							<strong>Match Check:</strong> 
							{client.brokerId === debugInfo.currentUser.uid ? '✅ MATCHES' : '❌ NO MATCH'}
							<br>
							Current User UID: {debugInfo.currentUser.uid}
							<br>
							Client Broker ID: {client.brokerId}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Instructions -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
			<h2 class="text-xl font-semibold mb-4">🔧 How to Fix</h2>
			<ol class="list-decimal list-inside space-y-2">
				<li>Check if Current User UID matches any Client's Broker ID</li>
				<li>If no matches, update client records in Firestore to use the correct Broker ID</li>
				<li>The Broker ID should be the actual Firebase Auth UID of the broker user</li>
				<li>Go to Firebase Console → Firestore → clients collection → update brokerId field</li>
			</ol>
		</div>
	{/if}
</div> 
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/services/auth';
	import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/config/firebase';
	import LoadingSpinner from '$components/ui/LoadingSpinner.svelte';

	let uploading = false;
	let uploadedFiles = [];
	let message = '';
	let errorMessage = '';

	let documentForm = {
		name: '',
		type: 'application',
		description: '',
		relatedId: '',
		customerName: '',
		isConfidential: false,
		category: 'Insurance',
		expirationDate: ''
	};

	const documentTypes = [
		{ value: 'application', label: 'Application Form' },
		{ value: 'policy_certificate', label: 'Policy Certificate' },
		{ value: 'id_cards', label: 'Insurance ID Cards' },
		{ value: 'claim_form', label: 'Claim Form' },
		{ value: 'amendment', label: 'Policy Amendment' },
		{ value: 'renewal_notice', label: 'Renewal Notice' },
		{ value: 'invoice', label: 'Invoice' },
		{ value: 'correspondence', label: 'Correspondence' },
		{ value: 'other', label: 'Other Document' }
	];

	const categories = [
		'Insurance',
		'Legal',
		'Financial',
		'Administrative',
		'Claims',
		'Compliance'
	];

	onMount(() => {
		if (!$currentUser) {
			goto('/auth/login');
			return;
		}
	});

	function handleFileSelect(event) {
		const files = Array.from(event.target.files);
		uploadedFiles = files.map(file => ({
			file,
			name: file.name,
			size: file.size,
			type: file.type,
			uploading: false,
			uploaded: false,
			error: null
		}));
	}

	function removeFile(index) {
		uploadedFiles = uploadedFiles.filter((_, i) => i !== index);
	}

	function formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	async function uploadDocuments() {
		if (!documentForm.name || !documentForm.type || uploadedFiles.length === 0) {
			errorMessage = 'Please fill in all required fields and select at least one file.';
			return;
		}

		uploading = true;
		errorMessage = '';
		message = '';

		try {
			for (let i = 0; i < uploadedFiles.length; i++) {
				const fileData = uploadedFiles[i];
				uploadedFiles[i].uploading = true;

				// Simulate file upload (in real app, upload to Firebase Storage)
				await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

				// Create document record in Firestore
				const documentData = {
					brokerId: $currentUser.uid,
					brokerName: `${$currentUser.firstName} ${$currentUser.lastName}`,
					name: documentForm.name + (uploadedFiles.length > 1 ? ` (${i + 1})` : ''),
					type: documentForm.type,
					description: documentForm.description,
					relatedId: documentForm.relatedId || null,
					customerName: documentForm.customerName || '',
					isConfidential: documentForm.isConfidential,
					status: 'active',
					fileSize: Math.round(fileData.size / 1024), // KB
					mimeType: fileData.type,
					url: `https://docs.example.com/${documentForm.type}/${Date.now()}_${i}.pdf`,
					downloadUrl: `https://docs.example.com/download/${Date.now()}_${i}`,
					version: 1,
					expirationDate: documentForm.expirationDate ? new Date(documentForm.expirationDate) : null,
					tags: [],
					metadata: {
						category: documentForm.category,
						department: $currentUser.role === 'admin' ? 'Administration' : 'Sales',
						retention: '7_years'
					},
					uploadedBy: $currentUser.uid,
					uploadedByName: `${$currentUser.firstName} ${$currentUser.lastName}`,
					uploadedAt: serverTimestamp(),
					lastAccessed: serverTimestamp(),
					accessCount: 0,
					createdAt: serverTimestamp(),
					updatedAt: serverTimestamp()
				};

				await addDoc(collection(db, 'documents'), documentData);

				uploadedFiles[i].uploading = false;
				uploadedFiles[i].uploaded = true;
			}

			message = `Successfully uploaded ${uploadedFiles.length} document(s).`;
			
			// Reset form
			documentForm = {
				name: '',
				type: 'application',
				description: '',
				relatedId: '',
				customerName: '',
				isConfidential: false,
				category: 'Insurance',
				expirationDate: ''
			};
			uploadedFiles = [];

		} catch (error) {
			console.error('Error uploading documents:', error);
			errorMessage = 'Failed to upload documents. Please try again.';
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head>
	<title>Upload Documents - X Insurance Brokers</title>
	<meta name="description" content="Upload and manage insurance documents securely." />
</svelte:head>

<div class="container-page py-6">
	<div class="max-w-4xl mx-auto">
		<div class="flex items-center justify-between mb-8">
			<div>
				<h1 class="text-3xl font-bold text-neutral-900">Upload Documents</h1>
				<p class="text-neutral-600 mt-2">Securely upload and manage insurance documents</p>
			</div>
			<a
				href="/documents"
				class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
			>
				← Back to Documents
			</a>
		</div>

		<div class="bg-white rounded-xl shadow-sm border border-neutral-200">
			<div class="p-6">
				<form on:submit|preventDefault={uploadDocuments} class="space-y-6">
					<!-- Document Information -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label for="name" class="block text-sm font-medium text-neutral-700 mb-2">
								Document Name *
							</label>
							<input
								id="name"
								type="text"
								bind:value={documentForm.name}
								required
								placeholder="Enter document name"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="type" class="block text-sm font-medium text-neutral-700 mb-2">
								Document Type *
							</label>
							<select
								id="type"
								bind:value={documentForm.type}
								required
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each documentTypes as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="customerName" class="block text-sm font-medium text-neutral-700 mb-2">
								Customer Name
							</label>
							<input
								id="customerName"
								type="text"
								bind:value={documentForm.customerName}
								placeholder="Associated customer name"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="relatedId" class="block text-sm font-medium text-neutral-700 mb-2">
								Related ID
							</label>
							<input
								id="relatedId"
								type="text"
								bind:value={documentForm.relatedId}
								placeholder="Policy, claim, or quote ID"
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label for="category" class="block text-sm font-medium text-neutral-700 mb-2">
								Category
							</label>
							<select
								id="category"
								bind:value={documentForm.category}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							>
								{#each categories as category}
									<option value={category}>{category}</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="expirationDate" class="block text-sm font-medium text-neutral-700 mb-2">
								Expiration Date
							</label>
							<input
								id="expirationDate"
								type="date"
								bind:value={documentForm.expirationDate}
								class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							/>
						</div>
					</div>

					<div>
						<label for="description" class="block text-sm font-medium text-neutral-700 mb-2">
							Description
						</label>
						<textarea
							id="description"
							rows="3"
							bind:value={documentForm.description}
							placeholder="Brief description of the document"
							class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						></textarea>
					</div>

					<div class="flex items-center">
						<input
							id="isConfidential"
							type="checkbox"
							bind:checked={documentForm.isConfidential}
							class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
						/>
						<label for="isConfidential" class="ml-2 block text-sm text-neutral-700">
							Mark as confidential
						</label>
					</div>

					<!-- File Upload Area -->
					<div class="border-2 border-dashed border-neutral-300 rounded-lg p-6">
						<div class="text-center">
							<svg class="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
								<path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
							<div class="mt-4">
								<label for="file-upload" class="cursor-pointer">
									<span class="mt-2 block text-sm font-medium text-neutral-900">
										Click to upload files
									</span>
									<span class="mt-1 block text-sm text-neutral-500">
										PDF, DOC, DOCX, PNG, JPG up to 10MB each
									</span>
								</label>
								<input
									id="file-upload"
									name="file-upload"
									type="file"
									multiple
									accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
									on:change={handleFileSelect}
									class="sr-only"
								/>
							</div>
						</div>
					</div>

					<!-- Uploaded Files List -->
					{#if uploadedFiles.length > 0}
						<div>
							<h3 class="text-lg font-medium text-neutral-900 mb-4">Selected Files</h3>
							<div class="space-y-3">
								{#each uploadedFiles as fileData, index}
									<div class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
										<div class="flex items-center space-x-3">
											<div class="flex-shrink-0">
												{#if fileData.uploading}
													<LoadingSpinner size="sm" />
												{:else if fileData.uploaded}
													<svg class="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
													</svg>
												{:else}
													<svg class="w-5 h-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
													</svg>
												{/if}
											</div>
											<div>
												<p class="text-sm font-medium text-neutral-900">{fileData.name}</p>
												<p class="text-xs text-neutral-500">{formatFileSize(fileData.size)}</p>
											</div>
										</div>
										{#if !fileData.uploading && !fileData.uploaded}
											<button
												type="button"
												on:click={() => removeFile(index)}
												class="text-red-600 hover:text-red-800"
											>
												<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
												</svg>
											</button>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Messages -->
					{#if errorMessage}
						<div class="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
							{errorMessage}
						</div>
					{/if}

					{#if message}
						<div class="text-success-600 text-sm bg-success-50 border border-success-200 rounded-md p-3">
							{message}
						</div>
					{/if}

					<!-- Submit Button -->
					<div class="flex justify-end space-x-4">
						<button
							type="button"
							on:click={() => goto('/documents')}
							class="px-4 py-2 border border-neutral-300 rounded-md text-neutral-700 hover:bg-neutral-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={uploading || uploadedFiles.length === 0}
							class="bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
						>
							{#if uploading}
								<LoadingSpinner size="sm" />
								<span class="ml-2">Uploading...</span>
							{:else}
								Upload Documents
							{/if}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
</div> 
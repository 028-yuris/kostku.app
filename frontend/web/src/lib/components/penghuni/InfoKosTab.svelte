<script lang="ts">
	import { onMount } from 'svelte';
	import { getKos, type Kos } from '../../api';

	let { onNotify }: { onNotify: (msg: string, err?: boolean) => void } = $props();

	let kos = $state<Kos | null>(null);
	let memuat = $state(true);

	onMount(async () => {
		try {
			kos = await getKos();
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat informasi kos', true);
		} finally {
			memuat = false;
		}
	});

	async function salinRekening() {
		if (!kos?.rekening?.nomorRekening) return;
		try {
			await navigator.clipboard.writeText(kos.rekening.nomorRekening);
			onNotify('Nomor rekening berhasil disalin.');
		} catch {
			onNotify('Tidak dapat menyalin otomatis.', true);
		}
	}
</script>

<div class="space-y-5">
	<div>
		<h2 class="text-xl font-extrabold text-gray-900">Informasi Kos &amp; Rekening</h2>
		<p class="text-sm text-gray-500">Detail kontak pengelola, rekening pembayaran sewa, jadwal kunjung, dan tata tertib kos.</p>
	</div>

	{#if memuat}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat informasi kos…</div>
	{:else if kos}
		<div class="grid gap-4 lg:grid-cols-2">
			<!-- Profil & Kontak Kos -->
			<div class="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
				<div>
					<span class="rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">Profil Hunian</span>
					<h3 class="mt-2 text-lg font-extrabold text-gray-900">{kos.nama}</h3>
					<p class="mt-1 text-sm text-gray-600">{kos.alamat}</p>
					{#if kos.deskripsi}
						<p class="mt-2 text-xs text-gray-500">{kos.deskripsi}</p>
					{/if}
				</div>

				<dl class="space-y-2 rounded-2xl bg-cream/60 p-4 text-xs">
					<div class="flex justify-between gap-2">
						<dt class="text-gray-500">Pengelola</dt>
						<dd class="font-bold text-gray-900">{kos.namaPengelola}</dd>
					</div>
					<div class="flex justify-between gap-2">
						<dt class="text-gray-500">Jam Kunjung</dt>
						<dd class="font-semibold text-gray-800">{kos.jamKunjung}</dd>
					</div>
					<div class="flex justify-between gap-2">
						<dt class="text-gray-500">Jatuh Tempo Bulanan</dt>
						<dd class="font-semibold text-brand">Tanggal {kos.tanggalJatuhTempo ?? 10} setiap bulan</dd>
					</div>
				</dl>

				<div class="flex flex-wrap gap-2">
					{#if kos.whatsapp}
						<a href={kos.whatsapp} target="_blank" rel="noopener" class="flex-1 rounded-full bg-accent px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-accent-dark">
							Hubungi via WhatsApp
						</a>
					{/if}
					{#if kos.telepon}
						<a href={`tel:${kos.telepon}`} class="rounded-full border border-brand px-5 py-2.5 text-center text-xs font-semibold text-brand hover:bg-brand hover:text-white">
							Telepon ({kos.telepon})
						</a>
					{/if}
				</div>
			</div>

			<!-- Rekening & Aturan -->
			<div class="space-y-4">
				{#if kos.rekening}
					<div class="rounded-3xl bg-gradient-to-br from-brand-dark to-brand p-6 text-white shadow-sm">
						<p class="text-xs font-semibold text-white/80">Rekening Pembayaran Resmi</p>
						<p class="mt-1 text-lg font-extrabold">{kos.rekening.bank}</p>
						<div class="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 py-3">
							<div>
								<p class="font-mono text-lg font-bold tracking-wider">{kos.rekening.nomorRekening}</p>
								<p class="text-xs text-white/85">a.n. {kos.rekening.atasNama}</p>
							</div>
							<button
								onclick={salinRekening}
								class="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white hover:bg-accent-dark"
							>
								Salin
							</button>
						</div>
					</div>
				{/if}

				{#if kos.aturan?.length}
					<div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
						<h3 class="text-base font-extrabold text-gray-900">Aturan &amp; Tata Tertib Kos</h3>
						<ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-600">
							{#each kos.aturan as a (a)}
								<li>{a}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

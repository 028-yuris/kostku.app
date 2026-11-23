<script lang="ts">
	import {
		aset,
		createTiket,
		formatTanggal,
		getSemuaKamar,
		getTiketDetail,
		getTiketSaya,
		type Kamar,
		type TiketItem
	} from '../../api';

	let {
		onNotify,
		onRefreshSummary
	}: { onNotify: (msg: string, err?: boolean) => void; onRefreshSummary: () => void } = $props();

	let daftar = $state<TiketItem[]>([]);
	let kamarList = $state<Kamar[]>([]);
	let memuat = $state(true);
	let filterStatus = $state('');

	let detail = $state<TiketItem | null>(null);

	// Modal buat tiket baru
	let modalBuat = $state(false);
	let kirimMemuat = $state(false);
	let form = $state({
		kategori: 'fasilitas',
		kamarId: '',
		judul: '',
		deskripsi: ''
	});
	let fileFoto = $state<File | null>(null);
	let previewUrl = $state('');

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	async function muat() {
		memuat = true;
		try {
			const [t, k] = await Promise.all([
				getTiketSaya(filterStatus || undefined),
				kamarList.length ? Promise.resolve(kamarList) : getSemuaKamar()
			]);
			daftar = t;
			kamarList = k;
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat tiket laporan', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		filterStatus;
		muat();
	});

	function bukaBuat() {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = '';
		fileFoto = null;
		form = { kategori: 'fasilitas', kamarId: '', judul: '', deskripsi: '' };
		modalBuat = true;
	}

	function pilihFoto(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0] ?? null;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		fileFoto = f;
		previewUrl = f ? URL.createObjectURL(f) : '';
	}

	async function kirimTiket(e: Event) {
		e.preventDefault();
		if (!form.judul.trim() || !form.deskripsi.trim()) return;
		kirimMemuat = true;
		try {
			await createTiket({
				kategori: form.kategori,
				judul: form.judul.trim(),
				deskripsi: form.deskripsi.trim(),
				kamarId: form.kamarId ? Number(form.kamarId) : null,
				foto: fileFoto
			});
			onNotify('Laporan kerusakan berhasil dikirim ke pengelola.');
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = '';
			modalBuat = false;
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal membuat tiket laporan', true);
		} finally {
			kirimMemuat = false;
		}
	}

	async function bukaDetail(t: TiketItem) {
		detail = t;
		try {
			detail = await getTiketDetail(t.id);
		} catch {
			/* tetap pakai data ringkas */
		}
	}

	const badge = (s: string) => {
		if (s === 'selesai') return 'bg-emerald-100 text-emerald-700';
		if (s === 'diproses') return 'bg-brand/15 text-brand';
		return 'bg-amber-100 text-amber-800';
	};

	const inputCls =
		'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
</script>

<div class="space-y-5">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-xl font-extrabold text-gray-900">Tiket Laporan Kerusakan</h2>
			<p class="text-sm text-gray-500">Laporkan kerusakan fasilitas kamar atau area umum dan pantau progres penanganannya.</p>
		</div>
		<button
			onclick={bukaBuat}
			class="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-dark"
		>
			+ Buat Laporan
		</button>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each [{ l: 'Semua', v: '' }, { l: 'Pending', v: 'pending' }, { l: 'Diproses', v: 'diproses' }, { l: 'Selesai', v: 'selesai' }] as f (f.l)}
			<button
				onclick={() => (filterStatus = f.v)}
				class="rounded-full border px-4 py-1.5 text-xs font-semibold transition {filterStatus === f.v
					? 'border-brand bg-brand text-white'
					: 'border-brand/30 bg-white text-brand hover:border-brand'}"
			>
				{f.l}
			</button>
		{/each}
	</div>

	{#if memuat}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat laporan kerusakan…</div>
	{:else if daftar.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Belum ada laporan kerusakan pada filter ini.</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2">
			{#each daftar as t (t.id)}
				<div class="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div>
						<div class="flex items-start justify-between gap-2">
							<div>
								<span class="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand">{t.kategori}</span>
								<h3 class="mt-1.5 font-bold text-gray-900">{t.judul}</h3>
								<p class="text-xs text-gray-500">Kamar/Area: {t.kamar ?? 'Area Umum'} · {formatTanggal(t.tanggalLapor)}</p>
							</div>
							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize {badge(t.status)}">{t.status}</span>
						</div>
						<p class="mt-2 line-clamp-2 text-sm text-gray-600">{t.deskripsi}</p>
						{#if t.penanganan}
							<p class="mt-2 rounded-lg bg-cream/70 px-2.5 py-1.5 text-xs text-gray-700">Penanganan: {t.penanganan}</p>
						{/if}
					</div>
					<div class="mt-4 flex border-t pt-3">
						<button
							onclick={() => bukaDetail(t)}
							class="rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
						>
							Detail &amp; Riwayat
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ===== Modal Buat Tiket ===== -->
{#if modalBuat}
	<div use:portal class="fixed inset-0 z-[60] overflow-y-auto bg-black/60" role="dialog" aria-modal="true" aria-label="Buat laporan kerusakan">
		<div class="flex min-h-full items-end justify-center sm:items-center sm:p-4">
			<button class="fixed inset-0 cursor-default" aria-label="Tutup" onclick={() => (modalBuat = false)}></button>
			<form onsubmit={kirimTiket} class="relative w-full max-w-md space-y-3 rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-extrabold text-brand">Buat Laporan Kerusakan</h3>
					<button type="button" onclick={() => (modalBuat = false)} class="text-2xl text-gray-400" aria-label="Tutup">×</button>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<label class="block text-xs font-semibold text-gray-600">
						Kategori
						<select bind:value={form.kategori} class={inputCls}>
							<option value="air">Air / Kran</option>
							<option value="listrik">Listrik / Lampu</option>
							<option value="elektronik">Elektronik / AC</option>
							<option value="fasilitas">Fasilitas Kamar</option>
							<option value="kebersihan">Kebersihan</option>
							<option value="lainnya">Lainnya</option>
						</select>
					</label>
					<label class="block text-xs font-semibold text-gray-600">
						Lokasi / Kamar
						<select bind:value={form.kamarId} class={inputCls}>
							<option value="">Area Umum</option>
							{#each kamarList as k (k.id)}
								<option value={String(k.id)}>Kamar {k.kode} (Lt. {k.lantai})</option>
							{/each}
						</select>
					</label>
				</div>

				<label class="block text-xs font-semibold text-gray-600">
					Judul Laporan
					<input bind:value={form.judul} required placeholder="Contoh: AC kurang dingin" class={inputCls} />
				</label>

				<label class="block text-xs font-semibold text-gray-600">
					Deskripsi Masalah
					<textarea bind:value={form.deskripsi} required rows="3" placeholder="Jelaskan kendala yang dialami secara singkat…" class={inputCls}></textarea>
				</label>

				<label class="block text-xs font-semibold text-gray-600">
					Foto Kerusakan (opsional, maks. 2 MB)
					<input type="file" accept="image/*" onchange={pilihFoto} class="mt-1 block w-full text-xs text-gray-600" />
				</label>

				{#if previewUrl}
					<div class="overflow-hidden rounded-2xl border bg-gray-50 p-2">
						<img src={previewUrl} alt="Pratinjau foto kerusakan" class="mx-auto max-h-36 rounded-xl object-contain" />
					</div>
				{/if}

				<div class="flex gap-3 pt-2">
					<button type="button" onclick={() => (modalBuat = false)} class="flex-1 rounded-full border py-2.5 text-sm font-semibold text-gray-700">Batal</button>
					<button disabled={kirimMemuat} class="flex-1 rounded-full bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60">
						{kirimMemuat ? 'Mengirim…' : 'Kirim Laporan'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ===== Modal Detail Tiket ===== -->
{#if detail}
	<div use:portal class="fixed inset-0 z-[60] overflow-y-auto bg-black/60" role="dialog" aria-modal="true" aria-label="Detail tiket">
		<div class="flex min-h-full items-end justify-center sm:items-center sm:p-4">
			<button class="fixed inset-0 cursor-default" aria-label="Tutup" onclick={() => (detail = null)}></button>
			<div class="relative w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
				<div class="flex items-start justify-between gap-2">
					<div>
						<div class="flex items-center gap-2">
							<span class="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand">{detail.kategori}</span>
							<span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize {badge(detail.status)}">{detail.status}</span>
						</div>
						<h3 class="mt-1.5 text-lg font-extrabold text-gray-900">{detail.judul}</h3>
						<p class="text-xs text-gray-500">Kamar/Area: {detail.kamar ?? 'Area Umum'} · {formatTanggal(detail.tanggalLapor)}</p>
					</div>
					<button onclick={() => (detail = null)} class="text-2xl text-gray-400" aria-label="Tutup">×</button>
				</div>

				{#if detail.foto}
					<img src={aset(detail.foto)} alt="Foto keluhan" class="mt-3 aspect-video w-full rounded-2xl object-cover" />
				{/if}
				<p class="mt-3 text-sm text-gray-700">{detail.deskripsi}</p>

				<h4 class="mt-4 text-xs font-bold text-gray-700">Riwayat Penanganan</h4>
				<ul class="mt-2 space-y-2">
					{#each detail.riwayat as r (r.tanggal + r.status)}
						<li class="rounded-xl bg-cream/60 px-3 py-2 text-xs">
							<div class="flex justify-between font-bold">
								<span class="capitalize text-brand">{r.status}</span>
								<span class="font-normal text-gray-500">{formatTanggal(r.tanggal)}</span>
							</div>
							<p class="mt-0.5 text-gray-600">{r.catatan}</p>
						</li>
					{/each}
				</ul>

				<div class="mt-5 flex">
					<button onclick={() => (detail = null)} class="w-full rounded-full border py-2.5 text-sm font-semibold text-gray-700">Tutup</button>
				</div>
			</div>
		</div>
	</div>
{/if}

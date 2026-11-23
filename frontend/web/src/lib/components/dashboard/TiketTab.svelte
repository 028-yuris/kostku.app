<script lang="ts">
	import {
		aset,
		formatTanggal,
		getTiket,
		getTiketDetail,
		updateStatusTiket,
		type TiketItem
	} from '../../api';

	let { onNotify, onRefreshSummary }: { onNotify: (msg: string, err?: boolean) => void; onRefreshSummary: () => void } =
		$props();

	let daftar = $state<TiketItem[]>([]);
	let memuat = $state(true);
	let filterStatus = $state('');
	let filterKategori = $state('');

	let detail = $state<TiketItem | null>(null);
	let catatanBaru = $state('');
	let proses = $state(false);

	async function muat() {
		memuat = true;
		try {
			daftar = await getTiket(filterStatus || undefined, filterKategori || undefined);
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat tiket', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		filterStatus;
		filterKategori;
		muat();
	});

	async function bukaDetail(t: TiketItem) {
		detail = t;
		catatanBaru = '';
		try {
			detail = await getTiketDetail(t.id);
		} catch {
			/* pakai data ringkas */
		}
	}

	async function majukanStatus(t: TiketItem, nextStatus: 'diproses' | 'selesai', catatan?: string) {
		proses = true;
		try {
			const updated = await updateStatusTiket(t.id, nextStatus, catatan || undefined);
			onNotify(`Tiket diubah ke status '${nextStatus}'.`);
			if (detail && detail.id === t.id) detail = { ...detail, ...updated };
			catatanBaru = '';
			await muat();
			onRefreshSummary();
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal mengubah status tiket', true);
		} finally {
			proses = false;
		}
	}

	const badge = (s: string) => {
		if (s === 'selesai') return 'bg-emerald-100 text-emerald-700';
		if (s === 'diproses') return 'bg-brand/15 text-brand';
		return 'bg-amber-100 text-amber-800';
	};
</script>

<div class="space-y-5">
	<div>
		<h2 class="text-xl font-extrabold text-gray-900">Tiket Laporan Kerusakan</h2>
		<p class="text-sm text-gray-500">Tangani laporan keluhan dan kerusakan dari penghuni (pending → diproses → selesai).</p>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each [{ l: 'Semua Status', v: '' }, { l: 'Pending', v: 'pending' }, { l: 'Diproses', v: 'diproses' }, { l: 'Selesai', v: 'selesai' }] as f (f.l)}
			<button onclick={() => (filterStatus = f.v)} class="rounded-full border px-4 py-1.5 text-xs font-semibold {filterStatus === f.v ? 'border-brand bg-brand text-white' : 'border-brand/30 bg-white text-brand'}">{f.l}</button>
		{/each}
		<select bind:value={filterKategori} aria-label="Filter kategori" class="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs outline-none focus:border-brand">
			<option value="">Semua kategori</option>
			<option value="air">Air</option>
			<option value="listrik">Listrik</option>
			<option value="elektronik">Elektronik</option>
			<option value="fasilitas">Fasilitas</option>
			<option value="kebersihan">Kebersihan</option>
			<option value="lainnya">Lainnya</option>
		</select>
	</div>

	{#if memuat}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat daftar tiket…</div>
	{:else if daftar.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Tidak ada tiket pada filter ini.</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2">
			{#each daftar as t (t.id)}
				<div class="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div>
						<div class="flex items-start justify-between gap-2">
							<div>
								<span class="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand">{t.kategori}</span>
								<h3 class="mt-1.5 font-bold text-gray-900">{t.judul}</h3>
								<p class="text-xs text-gray-500">{t.pelapor ?? `User #${t.userId}`} · Kamar {t.kamar ?? '-'} · {formatTanggal(t.tanggalLapor)}</p>
							</div>
							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize {badge(t.status)}">{t.status}</span>
						</div>
						<p class="mt-2 line-clamp-2 text-sm text-gray-600">{t.deskripsi}</p>
						{#if t.penanganan}<p class="mt-2 rounded-lg bg-cream/70 px-2.5 py-1.5 text-xs text-gray-700">Penanganan: {t.penanganan}</p>{/if}
					</div>
					<div class="mt-4 flex flex-wrap gap-2 border-t pt-3">
						<button onclick={() => bukaDetail(t)} class="rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white">Detail & Riwayat</button>
						{#if t.status === 'pending'}
							<button disabled={proses} onclick={() => majukanStatus(t, 'diproses', 'Laporan sedang ditindaklanjuti')} class="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white hover:bg-brand-dark">Proses Sekarang</button>
						{:else if t.status === 'diproses'}
							<button disabled={proses} onclick={() => majukanStatus(t, 'selesai', 'Perbaikan telah selesai dikerjakan')} class="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">Tandai Selesai</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if detail}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
		<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (detail = null)}></button>
		<div class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
			<div class="flex items-start justify-between">
				<div>
					<span class="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-bold uppercase text-brand">{detail.kategori}</span>
					<h3 class="mt-1 text-lg font-extrabold text-gray-900">{detail.judul}</h3>
					<p class="text-xs text-gray-500">{detail.pelapor} · Kamar {detail.kamar}</p>
				</div>
				<button onclick={() => (detail = null)} class="text-2xl text-gray-400" aria-label="Tutup">×</button>
			</div>

			{#if detail.foto}
				<img src={aset(detail.foto)} alt="Foto keluhan" class="mt-3 aspect-video w-full rounded-2xl object-cover" />
			{/if}
			<p class="mt-3 text-sm text-gray-700">{detail.deskripsi}</p>

			<h4 class="mt-4 text-xs font-bold text-gray-700">Riwayat Status</h4>
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

			{#if detail.status !== 'selesai'}
				{@const next = detail.status === 'pending' ? 'diproses' : 'selesai'}
				<form
					onsubmit={(e) => {
						e.preventDefault();
						if (detail) majukanStatus(detail, next, catatanBaru);
					}}
					class="mt-4 space-y-2 border-t pt-4"
				>
					<input bind:value={catatanBaru} placeholder="Catatan penanganan (opsional)" class="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
					<button disabled={proses} class="w-full rounded-full bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60">
						Ubah Status ke {next === 'diproses' ? 'Diproses' : 'Selesai'}
					</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

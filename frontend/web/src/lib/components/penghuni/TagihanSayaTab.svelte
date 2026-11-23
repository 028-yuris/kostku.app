<script lang="ts">
	import {
		aset,
		formatTanggal,
		getKos,
		getTagihanDetail,
		getTagihanSaya,
		rupiah,
		uploadBuktiPembayaran,
		type Kos,
		type TagihanItem,
		type TagihanSayaItem
	} from '../../api';

	let {
		onNotify,
		onRefreshSummary
	}: { onNotify: (msg: string, err?: boolean) => void; onRefreshSummary: () => void } = $props();

	let daftar = $state<TagihanSayaItem[]>([]);
	let kos = $state<Kos | null>(null);
	let memuat = $state(true);
	let filterStatus = $state('');

	let detail = $state<TagihanItem | null>(null);
	let detailMemuat = $state(false);

	// Modal unggah bukti bayar
	let bayarTarget = $state<TagihanSayaItem | null>(null);
	let fileBukti = $state<File | null>(null);
	let previewUrl = $state('');
	let jumlahBayar = $state(0);
	let metodeBayar = $state('Transfer Bank BCA');
	let catatanBayar = $state('');
	let kirimMemuat = $state(false);

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	async function muat() {
		memuat = true;
		try {
			const [t, k] = await Promise.all([getTagihanSaya(), kos ? Promise.resolve(kos) : getKos()]);
			daftar = t;
			kos = k;
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat tagihan', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		muat();
	});

	const tersaring = $derived(
		daftar.filter((t) => {
			if (!filterStatus) return true;
			const st = t.status.toLowerCase();
			if (filterStatus === 'belum_bayar') return st === 'belum_bayar' || st === 'belum_lunas';
			return st === filterStatus;
		})
	);

	const bisaBayar = (t: TagihanSayaItem) => t.status === 'belum_bayar' || t.status === 'belum_lunas';

	async function bukaDetail(id: number) {
		detailMemuat = true;
		try {
			detail = await getTagihanDetail(id);
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat detail tagihan', true);
		} finally {
			detailMemuat = false;
		}
	}

	function bukaBayar(t: TagihanSayaItem) {
		bayarTarget = t;
		fileBukti = null;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = '';
		jumlahBayar = t.nominal;
		metodeBayar = kos?.rekening?.bank ? `Transfer Bank ${kos.rekening.bank}` : 'Transfer Bank';
		catatanBayar = '';
	}

	function pilihFile(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0] ?? null;
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		fileBukti = f;
		previewUrl = f ? URL.createObjectURL(f) : '';
	}

	async function kirimPembayaran(e: Event) {
		e.preventDefault();
		if (!bayarTarget || !fileBukti) {
			onNotify('Silakan pilih foto bukti transfer terlebih dahulu.', true);
			return;
		}
		kirimMemuat = true;
		try {
			await uploadBuktiPembayaran(bayarTarget.id, fileBukti, {
				jumlah: Number(jumlahBayar) || bayarTarget.nominal,
				metode: metodeBayar.trim() || 'Transfer Bank',
				catatan: catatanBayar.trim() || undefined
			});
			onNotify('Bukti pembayaran berhasil diunggah. Menunggu verifikasi pengelola.');
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = '';
			bayarTarget = null;
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal mengunggah bukti transfer', true);
		} finally {
			kirimMemuat = false;
		}
	}

	const badge = (s: string) => {
		if (s === 'lunas') return 'bg-emerald-100 text-emerald-700';
		if (s === 'menunggu_verifikasi') return 'bg-amber-100 text-amber-800';
		return 'bg-red-100 text-red-700';
	};

	const labelStatus = (s: string) => {
		if (s === 'belum_lunas' || s === 'belum_bayar') return 'Belum Bayar';
		if (s === 'menunggu_verifikasi') return 'Menunggu Verifikasi';
		if (s === 'lunas') return 'Lunas';
		return s;
	};
</script>

<div class="space-y-5">
	<div>
		<h2 class="text-xl font-extrabold text-gray-900">Tagihan Saya</h2>
		<p class="text-sm text-gray-500">Pantau tagihan sewa bulanan, tanggal jatuh tempo, dan unggah bukti transfer.</p>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each [{ l: 'Semua', v: '' }, { l: 'Belum Bayar', v: 'belum_bayar' }, { l: 'Menunggu Verifikasi', v: 'menunggu_verifikasi' }, { l: 'Lunas', v: 'lunas' }] as f (f.l)}
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
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat tagihan Anda…</div>
	{:else if tersaring.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Tidak ada tagihan pada filter ini.</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2">
			{#each tersaring as t (t.id)}
				<div class="flex flex-col justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div>
						<div class="flex items-start justify-between gap-2">
							<div>
								<h3 class="font-bold text-gray-900">Periode {t.bulan || t.periode}</h3>
								<p class="text-xs text-gray-500">
									Kamar {t.kamar?.kode ?? t.kamarId} · Jatuh tempo {formatTanggal(t.jatuhTempo)}
								</p>
							</div>
							<span class="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold {badge(t.status)}">
								{labelStatus(t.status)}
							</span>
						</div>

						<div class="mt-3 flex items-baseline justify-between gap-2">
							<p class="text-xl font-extrabold text-brand">{rupiah(t.nominal)}</p>
							{#if t.terlambat}
								<span class="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
									Telat {t.hariTerlambat} hari
								</span>
							{/if}
						</div>

						{#if t.catatan}
							<p class="mt-2 text-xs text-gray-500">{t.catatan}</p>
						{/if}
					</div>

					<div class="mt-4 flex flex-wrap gap-2 border-t pt-3">
						<button
							onclick={() => bukaDetail(t.id)}
							class="rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
						>
							Detail
						</button>
						{#if bisaBayar(t)}
							<button
								onclick={() => bukaBayar(t)}
								class="flex-1 rounded-full bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-accent-dark"
							>
								Unggah Bukti Bayar
							</button>
						{:else if t.status === 'menunggu_verifikasi'}
							<span class="flex-1 py-1.5 text-right text-xs font-semibold text-amber-700">Sedang diverifikasi pengelola</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- ===== Modal Detail Tagihan ===== -->
{#if detail || detailMemuat}
	<div use:portal class="fixed inset-0 z-[60] overflow-y-auto bg-black/60" role="dialog" aria-modal="true" aria-label="Detail tagihan">
		<div class="flex min-h-full items-end justify-center sm:items-center sm:p-4">
			<button class="fixed inset-0 cursor-default" aria-label="Tutup" onclick={() => { detail = null; detailMemuat = false; }}></button>
			<div class="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
				{#if detailMemuat && !detail}
					<p class="py-6 text-center text-sm text-gray-500">Memuat detail tagihan…</p>
				{:else if detail}
					<div class="flex items-start justify-between gap-2 border-b pb-3">
						<div>
							<h3 class="text-lg font-extrabold text-brand">Tagihan {detail.bulan || detail.periode}</h3>
							<p class="text-xs text-gray-500">Kamar {detail.kamar?.kode ?? detail.kamarId} · {detail.kamar?.tipe ?? ''}</p>
						</div>
						<button onclick={() => (detail = null)} class="flex h-8 w-8 items-center justify-center rounded-full text-xl text-gray-400 hover:bg-gray-100" aria-label="Tutup">×</button>
					</div>

					<dl class="mt-4 grid grid-cols-2 gap-y-2 rounded-2xl bg-cream/60 p-3.5 text-xs">
						<dt class="text-gray-500">Nominal</dt>
						<dd class="text-right text-sm font-extrabold text-brand">{rupiah(detail.nominal)}</dd>
						<dt class="text-gray-500">Jatuh Tempo</dt>
						<dd class="text-right font-medium text-gray-800">{formatTanggal(detail.jatuhTempo)}</dd>
						<dt class="text-gray-500">Status</dt>
						<dd class="text-right"><span class="rounded-full px-2 py-0.5 font-bold {badge(detail.status)}">{labelStatus(detail.status)}</span></dd>
						{#if detail.terlambat}
							<dt class="text-red-600">Keterlambatan</dt>
							<dd class="text-right font-bold text-red-600">{detail.hariTerlambat} hari</dd>
						{/if}
					</dl>

					{#if detail.catatan}
						<p class="mt-3 text-xs text-gray-600">{detail.catatan}</p>
					{/if}

					{#if detail.pembayaran?.length}
						<h4 class="mt-4 text-xs font-bold text-gray-700">Riwayat Percobaan Pembayaran</h4>
						<ul class="mt-2 space-y-2">
							{#each detail.pembayaran as bayar (bayar.id)}
								<li class="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs">
									<div class="flex items-center gap-2.5 min-w-0">
										{#if bayar.buktiFoto}
											<a href={aset(bayar.buktiFoto)} target="_blank" rel="noopener" class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-cream">
												<img src={aset(bayar.buktiFoto)} alt="Bukti" class="h-full w-full object-cover" />
											</a>
										{/if}
										<div class="min-w-0">
											<p class="truncate font-semibold text-gray-800">{bayar.metode}</p>
											<p class="text-[11px] text-gray-500">{formatTanggal(bayar.tanggalBayar)}</p>
										</div>
									</div>
									<span class="shrink-0 font-bold capitalize {bayar.status === 'diterima' ? 'text-emerald-600' : bayar.status === 'ditolak' ? 'text-red-600' : 'text-amber-700'}">
										{bayar.status}
									</span>
								</li>
							{/each}
						</ul>
					{/if}

					<div class="mt-5 flex gap-2">
						{#if detail.status === 'belum_bayar' || detail.status === 'belum_lunas'}
							<button
								onclick={() => {
									const target = detail as unknown as TagihanSayaItem;
									detail = null;
									bukaBayar(target);
								}}
								class="flex-1 rounded-full bg-accent py-2.5 text-xs font-bold text-white hover:bg-accent-dark"
							>
								Unggah Bukti Bayar
							</button>
						{/if}
						<button onclick={() => (detail = null)} class="flex-1 rounded-full border py-2.5 text-xs font-semibold text-gray-700">Tutup</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- ===== Modal Unggah Bukti Pembayaran ===== -->
{#if bayarTarget}
	<div use:portal class="fixed inset-0 z-[70] overflow-y-auto bg-black/60" role="dialog" aria-modal="true" aria-label="Unggah bukti pembayaran">
		<div class="flex min-h-full items-end justify-center sm:items-center sm:p-4">
			<button class="fixed inset-0 cursor-default" aria-label="Tutup" onclick={() => (bayarTarget = null)}></button>
			<form onsubmit={kirimPembayaran} class="relative w-full max-w-md space-y-3.5 rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
				<div class="flex items-start justify-between gap-2">
					<div>
						<h3 class="text-lg font-extrabold text-brand">Unggah Bukti Transfer</h3>
						<p class="text-xs text-gray-500">Periode {bayarTarget.bulan || bayarTarget.periode} · {rupiah(bayarTarget.nominal)}</p>
					</div>
					<button type="button" onclick={() => (bayarTarget = null)} class="text-2xl text-gray-400" aria-label="Tutup">×</button>
				</div>

				{#if kos?.rekening}
					<div class="rounded-2xl bg-cream/80 p-3 text-xs">
						<p class="font-bold text-brand">Rekening Tujuan Pembayaran</p>
						<p class="mt-1 text-gray-800">
							<b>{kos.rekening.bank}</b> · <span class="font-mono font-bold">{kos.rekening.nomorRekening}</span>
						</p>
						<p class="text-gray-600">a.n. {kos.rekening.atasNama}</p>
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<label class="block text-xs font-semibold text-gray-600">
						Jumlah Transfer
						<input bind:value={jumlahBayar} type="number" min="1" required class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
					</label>
					<label class="block text-xs font-semibold text-gray-600">
						Metode
						<input bind:value={metodeBayar} required placeholder="Transfer Bank BCA" class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
					</label>
				</div>

				<label class="block text-xs font-semibold text-gray-600">
					Foto Bukti Transfer (JPG/PNG, maks. 2 MB)
					<input type="file" accept="image/*" required onchange={pilihFile} class="mt-1 block w-full text-xs text-gray-600" />
				</label>

				{#if previewUrl}
					<div class="overflow-hidden rounded-2xl border bg-gray-50 p-2">
						<img src={previewUrl} alt="Pratinjau bukti" class="mx-auto max-h-40 rounded-xl object-contain" />
					</div>
				{/if}

				<label class="block text-xs font-semibold text-gray-600">
					Catatan (opsional)
					<input bind:value={catatanBayar} placeholder="Contoh: Transfer dari rekening a.n. Alya" class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand" />
				</label>

				<div class="flex gap-2 pt-1">
					<button type="button" onclick={() => (bayarTarget = null)} class="flex-1 rounded-full border py-2.5 text-xs font-semibold text-gray-700">Batal</button>
					<button disabled={kirimMemuat} class="flex-1 rounded-full bg-accent py-2.5 text-xs font-bold text-white hover:bg-accent-dark disabled:opacity-60">
						{kirimMemuat ? 'Mengunggah…' : 'Kirim Bukti Bayar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

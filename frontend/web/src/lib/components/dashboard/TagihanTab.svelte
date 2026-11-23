<script lang="ts">
	import {
		formatTanggal,
		generateTagihan,
		getPenunggak,
		getTagihan,
		getTagihanDetail,
		rupiah,
		type PenunggakItem,
		type TagihanItem
	} from '../../api';

	let { onNotify, onRefreshSummary }: { onNotify: (msg: string, err?: boolean) => void; onRefreshSummary: () => void } =
		$props();

	let subtab = $state<'semua' | 'penunggak'>('semua');
	let periode = $state('');
	let filterStatus = $state('');
	let periodeGenerate = $state(new Date().toISOString().slice(0, 7));
	let genMemuat = $state(false);

	let daftar = $state<TagihanItem[]>([]);
	let penunggak = $state<PenunggakItem[]>([]);
	let memuat = $state(true);
	let detail = $state<TagihanItem | null>(null);

	async function muat() {
		memuat = true;
		try {
			const [t, p] = await Promise.all([
				getTagihan(periode.trim() || undefined, filterStatus || undefined),
				getPenunggak()
			]);
			daftar = t;
			penunggak = p;
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat tagihan', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		periode;
		filterStatus;
		muat();
	});

	async function buatTagihan(e: Event) {
		e.preventDefault();
		if (!periodeGenerate) return;
		genMemuat = true;
		try {
			const res = await generateTagihan(periodeGenerate);
			onNotify(`Periode ${res.periode}: ${res.totalDibuat} tagihan dibuat, ${res.totalDilewati} dilewati.`);
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal generate tagihan', true);
		} finally {
			genMemuat = false;
		}
	}

	async function bukaDetail(id: number) {
		try {
			detail = await getTagihanDetail(id);
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat detail tagihan', true);
		}
	}

	const badge = (s: string) => {
		if (s === 'lunas') return 'bg-emerald-100 text-emerald-700';
		if (s === 'menunggu_verifikasi') return 'bg-amber-100 text-amber-800';
		return 'bg-red-100 text-red-700';
	};
</script>

<div class="space-y-5">
	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<div>
			<h2 class="text-xl font-extrabold text-gray-900">Tagihan &amp; Daftar Penunggak</h2>
			<p class="text-sm text-gray-500">Terbitkan tagihan bulanan otomatis untuk seluruh sewa aktif dan pantau keterlambatan.</p>
		</div>
		<form onsubmit={buatTagihan} class="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
			<input type="month" bind:value={periodeGenerate} required aria-label="Periode tagihan" class="rounded-xl border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand" />
			<button disabled={genMemuat} class="rounded-full bg-accent px-4 py-2 text-xs font-bold text-white hover:bg-accent-dark disabled:opacity-60">
				{genMemuat ? 'Membuat…' : 'Terbitkan Tagihan'}
			</button>
		</form>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex gap-2">
			<button onclick={() => (subtab = 'semua')} class="rounded-full px-4 py-1.5 text-xs font-bold {subtab === 'semua' ? 'bg-brand text-white' : 'bg-white text-gray-700 ring-1 ring-black/10'}">Semua Tagihan ({daftar.length})</button>
			<button onclick={() => (subtab = 'penunggak')} class="rounded-full px-4 py-1.5 text-xs font-bold {subtab === 'penunggak' ? 'bg-red-600 text-white' : 'bg-white text-red-600 ring-1 ring-red-200'}">Penunggak ({penunggak.length})</button>
		</div>

		{#if subtab === 'semua'}
			<div class="flex flex-wrap gap-2">
				<input type="month" bind:value={periode} aria-label="Filter periode" class="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs outline-none focus:border-brand" />
				<select bind:value={filterStatus} aria-label="Filter status" class="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs outline-none focus:border-brand">
					<option value="">Semua status</option>
					<option value="belum_bayar">Belum Bayar</option>
					<option value="menunggu_verifikasi">Menunggu Verifikasi</option>
					<option value="lunas">Lunas</option>
				</select>
				{#if periode || filterStatus}
					<button onclick={() => { periode = ''; filterStatus = ''; }} class="text-xs font-semibold text-brand hover:underline">Reset</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if memuat}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat data tagihan…</div>
	{:else if subtab === 'semua'}
		{#if daftar.length === 0}
			<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Tidak ada tagihan pada filter ini.</div>
		{:else}
			<div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="border-b bg-cream/60 text-xs font-bold text-gray-600">
							<tr>
								<th class="px-4 py-3">Penghuni</th>
								<th class="px-4 py-3">Kamar</th>
								<th class="px-4 py-3">Periode</th>
								<th class="px-4 py-3">Nominal</th>
								<th class="px-4 py-3">Jatuh Tempo</th>
								<th class="px-4 py-3">Status</th>
								<th class="px-4 py-3 text-right">Detail</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each daftar as t (t.id)}
								<tr class="hover:bg-cream/30">
									<td class="px-4 py-3 font-semibold text-gray-900">{t.user?.nama ?? `User #${t.userId}`}</td>
									<td class="px-4 py-3">Kamar {t.kamar?.kode ?? t.kamarId}</td>
									<td class="px-4 py-3 text-gray-600">{t.periode}</td>
									<td class="px-4 py-3 font-bold text-brand">{rupiah(t.nominal)}</td>
									<td class="px-4 py-3 text-xs text-gray-600">{formatTanggal(t.jatuhTempo)}</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2.5 py-0.5 text-[11px] font-bold {badge(t.status)}">{t.status.replace('_', ' ')}</span>
									</td>
									<td class="px-4 py-3 text-right">
										<button onclick={() => bukaDetail(t.id)} class="text-xs font-semibold text-brand hover:underline">Lihat</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{:else if penunggak.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-emerald-700 shadow-sm">Tidak ada penunggak saat ini.</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2">
			{#each penunggak as p (p.id)}
				<div class="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-red-100">
					<div>
						<div class="flex items-center gap-2">
							<h3 class="font-bold text-gray-900">{p.namaPenghuni ?? `User #${p.userId}`}</h3>
							<span class="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700">Telat {p.hariTerlambat} hari</span>
						</div>
						<p class="mt-0.5 text-xs text-gray-500">Kamar {p.kamar} · Periode {p.periode} · Tempo {formatTanggal(p.jatuhTempo)}</p>
						<p class="mt-1 text-sm font-extrabold text-red-600">{rupiah(p.nominal)}</p>
					</div>
					<button onclick={() => bukaDetail(p.tagihanId)} class="shrink-0 rounded-full border border-brand px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white">Detail</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if detail}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
		<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (detail = null)}></button>
		<div class="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
			<div class="flex items-start justify-between">
				<div>
					<h3 class="text-lg font-extrabold text-brand">Tagihan {detail.periode}</h3>
					<p class="text-xs text-gray-500">{detail.user?.nama} · Kamar {detail.kamar?.kode}</p>
				</div>
				<button onclick={() => (detail = null)} class="text-2xl text-gray-400" aria-label="Tutup">×</button>
			</div>
			<div class="mt-4 space-y-2 rounded-2xl bg-cream/60 p-4 text-sm">
				<div class="flex justify-between"><span class="text-gray-600">Nominal</span><b>{rupiah(detail.nominal)}</b></div>
				<div class="flex justify-between"><span class="text-gray-600">Jatuh Tempo</span><span>{formatTanggal(detail.jatuhTempo)}</span></div>
				<div class="flex justify-between"><span class="text-gray-600">Status</span><span class="font-bold">{detail.status.replace('_', ' ')}</span></div>
				{#if detail.terlambat}<div class="flex justify-between text-red-600"><span>Keterlambatan</span><b>{detail.hariTerlambat} hari</b></div>{/if}
			</div>
			{#if detail.catatan}<p class="mt-3 text-xs text-gray-600">{detail.catatan}</p>{/if}
			{#if detail.pembayaran?.length}
				<h4 class="mt-4 text-xs font-bold text-gray-700">Riwayat Percobaan Pembayaran</h4>
				<ul class="mt-2 space-y-2">
					{#each detail.pembayaran as bayar (bayar.id)}
						<li class="flex items-center justify-between rounded-xl border px-3 py-2 text-xs">
							<span>{bayar.metode} · {formatTanggal(bayar.tanggalBayar)}</span>
							<span class="font-bold capitalize">{bayar.status}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}

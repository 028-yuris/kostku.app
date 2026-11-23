<script lang="ts">
	import { aset, formatTanggal, getPembayaranSaya, rupiah, type PembayaranSayaItem } from '../../api';

	let { onNotify }: { onNotify: (msg: string, err?: boolean) => void } = $props();

	let daftar = $state<PembayaranSayaItem[]>([]);
	let memuat = $state(true);
	let filterStatus = $state('');

	let detail = $state<PembayaranSayaItem | null>(null);
	let lightbox = $state<string | null>(null);
	let zoom = $state(1);

	const adaModal = $derived(Boolean(detail || lightbox));

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return { destroy: () => node.remove() };
	}

	$effect(() => {
		if (typeof document === 'undefined') return;
		document.body.style.overflow = adaModal ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	function onKey(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		if (lightbox) lightbox = null;
		else if (detail) detail = null;
	}

	async function muat() {
		memuat = true;
		try {
			daftar = await getPembayaranSaya();
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat riwayat pembayaran', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		muat();
	});

	const tersaring = $derived(
		daftar.filter((p) => {
			if (!filterStatus) return true;
			const st = p.status.toLowerCase();
			if (filterStatus === 'menunggu') return st === 'menunggu' || st === 'pending';
			return st === filterStatus;
		})
	);

	function bukaGambar(src: string) {
		lightbox = src;
		zoom = 1;
	}

	function ubahZoom(delta: number) {
		zoom = Math.min(4, Math.max(1, Number((zoom + delta).toFixed(2))));
	}

	const badge = (s: string) => {
		if (s === 'diterima') return 'bg-emerald-100 text-emerald-700';
		if (s === 'ditolak') return 'bg-red-100 text-red-700';
		return 'bg-amber-100 text-amber-800';
	};
</script>

<svelte:window onkeydown={onKey} />

<div class="space-y-5">
	<div>
		<h2 class="text-xl font-extrabold text-gray-900">Riwayat Pembayaran</h2>
		<p class="text-sm text-gray-500">Daftar seluruh bukti transfer yang pernah Anda kirim beserta status verifikasinya.</p>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each [{ l: 'Semua', v: '' }, { l: 'Menunggu', v: 'menunggu' }, { l: 'Diterima', v: 'diterima' }, { l: 'Ditolak', v: 'ditolak' }] as f (f.l)}
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
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat riwayat pembayaran…</div>
	{:else if tersaring.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Belum ada riwayat pembayaran pada filter ini.</div>
	{:else}
		<ul class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each tersaring as p (p.id)}
				<li class="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
					<button
						onclick={() => p.buktiFoto && bukaGambar(aset(p.buktiFoto))}
						class="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream ring-1 ring-black/5"
						aria-label="Perbesar bukti transfer"
					>
						{#if p.buktiFoto}
							<img src={aset(p.buktiFoto)} alt="" class="h-full w-full object-cover" />
						{:else}
							<span class="text-[10px] text-gray-400">-</span>
						{/if}
					</button>

					<button onclick={() => (detail = p)} class="min-w-0 flex-1 text-left">
						<div class="flex items-center gap-2">
							<span class="truncate text-sm font-bold text-gray-900">Periode {p.bulan || p.periode || '-'}</span>
							<span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize {badge(p.status)}">{p.status}</span>
						</div>
						<p class="truncate text-xs text-gray-500">Kamar {p.kamar ?? '-'} · {formatTanggal(p.tanggalBayar)}</p>
						<p class="text-sm font-extrabold text-brand">{rupiah(p.nominal)}</p>
					</button>

					<button
						onclick={() => (detail = p)}
						class="shrink-0 rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
					>
						Detail
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- ===== Modal Detail Pembayaran ===== -->
{#if detail}
	<div use:portal class="fixed inset-0 z-[60] overflow-y-auto bg-black/60" role="dialog" aria-modal="true" aria-label="Detail pembayaran">
		<div class="flex min-h-full items-end justify-center sm:items-center sm:p-4">
			<button class="fixed inset-0 cursor-default" aria-label="Tutup" onclick={() => (detail = null)}></button>
			<div class="relative w-full max-w-md rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
				<div class="flex items-center justify-between gap-3 border-b px-4 py-3">
					<div class="min-w-0">
						<h3 class="truncate text-base font-extrabold text-gray-900">Detail Pembayaran</h3>
						<p class="truncate text-xs text-gray-500">Kamar {detail.kamar ?? '-'} · Periode {detail.bulan || detail.periode || '-'}</p>
					</div>
					<button onclick={() => (detail = null)} class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100" aria-label="Tutup">×</button>
				</div>

				<div class="space-y-3 p-4">
					{#if detail.buktiFoto}
						<button
							onclick={() => detail?.buktiFoto && bukaGambar(aset(detail.buktiFoto))}
							class="group relative block w-full overflow-hidden rounded-2xl bg-gray-100"
						>
							<img src={aset(detail.buktiFoto)} alt="Bukti transfer" class="mx-auto h-40 w-full object-contain" />
							<span class="absolute right-2 bottom-2 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold text-white">
								🔍 Perbesar
							</span>
						</button>
					{/if}

					<dl class="grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl bg-cream/60 p-3 text-xs">
						<dt class="text-gray-500">Status</dt>
						<dd class="text-right"><span class="rounded-full px-2 py-0.5 font-bold capitalize {badge(detail.status)}">{detail.status}</span></dd>
						<dt class="text-gray-500">Nominal</dt>
						<dd class="text-right text-sm font-extrabold text-brand">{rupiah(detail.nominal)}</dd>
						<dt class="text-gray-500">Metode</dt>
						<dd class="text-right font-medium text-gray-800">{detail.metode}</dd>
						<dt class="text-gray-500">Tanggal Bayar</dt>
						<dd class="text-right font-medium text-gray-800">{formatTanggal(detail.tanggalBayar)}</dd>
					</dl>
					{#if detail.catatan}
						<p class="rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-600"><b>Catatan:</b> {detail.catatan}</p>
					{/if}
				</div>

				<div class="sticky bottom-0 flex rounded-b-3xl border-t bg-white p-3">
					<button onclick={() => (detail = null)} class="flex-1 rounded-full border py-2.5 text-sm font-semibold text-gray-700">Tutup</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- ===== Lightbox Zoom Bukti Transfer ===== -->
{#if lightbox}
	<div use:portal class="fixed inset-0 z-[70] flex flex-col bg-black/90" role="dialog" aria-modal="true" aria-label="Bukti transfer">
		<div class="flex shrink-0 items-center justify-between gap-2 p-3 text-white">
			<div class="flex items-center gap-1.5">
				<button onclick={() => ubahZoom(-0.5)} disabled={zoom <= 1} class="h-9 w-9 rounded-full bg-white/15 text-lg font-bold hover:bg-white/25 disabled:opacity-40" aria-label="Perkecil">−</button>
				<span class="w-12 text-center text-sm font-semibold">{Math.round(zoom * 100)}%</span>
				<button onclick={() => ubahZoom(0.5)} disabled={zoom >= 4} class="h-9 w-9 rounded-full bg-white/15 text-lg font-bold hover:bg-white/25 disabled:opacity-40" aria-label="Perbesar">+</button>
				<button onclick={() => (zoom = 1)} class="ml-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25">Reset</button>
			</div>
			<button onclick={() => (lightbox = null)} class="h-9 w-9 rounded-full bg-white/15 text-xl hover:bg-white/25" aria-label="Tutup">×</button>
		</div>
		<div class="min-h-0 flex-1 overflow-auto">
			<div class="flex min-h-full items-center justify-center p-3">
				<button type="button" onclick={() => (zoom = zoom === 1 ? 2 : 1)} class={zoom === 1 ? 'cursor-zoom-in' : 'cursor-zoom-out'}>
					<img
						src={lightbox}
						alt="Bukti transfer"
						style={zoom === 1 ? 'max-height: calc(100dvh - 5rem); max-width: 100%;' : `width: ${zoom * 100}vw; max-width: none;`}
						class="rounded-lg object-contain"
					/>
				</button>
			</div>
		</div>
	</div>
{/if}

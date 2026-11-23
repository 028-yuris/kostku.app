<script lang="ts">
	import {
		akhiriSewa,
		createSewa,
		formatTanggal,
		getPenghuni,
		getSemuaKamar,
		getSewa,
		rupiah,
		type Kamar,
		type PenghuniItem,
		type SewaItem
	} from '../../api';

	let { onNotify, onRefreshSummary }: { onNotify: (msg: string, err?: boolean) => void; onRefreshSummary: () => void } =
		$props();

	let subtab = $state<'sewa' | 'penghuni'>('sewa');
	let filterSewa = $state('aktif');
	let sewaList = $state<SewaItem[]>([]);
	let penghuniList = $state<PenghuniItem[]>([]);
	let memuat = $state(true);

	// Modal tempatkan penghuni
	let modalSewa = $state(false);
	let calonPenghuni = $state<PenghuniItem[]>([]);
	let kamarKosong = $state<Kamar[]>([]);
	let simpanMemuat = $state(false);
	let form = $state({
		userId: 0,
		kamarId: 0,
		tanggalMasuk: new Date().toISOString().split('T')[0],
		hargaDisepakati: 0,
		deposit: 0,
		tanggalSelesai: ''
	});

	async function muat() {
		memuat = true;
		try {
			const [s, p] = await Promise.all([getSewa(filterSewa || undefined), getPenghuni()]);
			sewaList = s;
			penghuniList = p;
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat penghuni & sewa', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		filterSewa;
		muat();
	});

	async function bukaTempatkan() {
		try {
			const [tanpaSewa, kamarTersedia] = await Promise.all([getPenghuni(true), getSemuaKamar('kosong')]);
			calonPenghuni = tanpaSewa;
			kamarKosong = kamarTersedia;
			form = {
				userId: tanpaSewa[0]?.id ?? 0,
				kamarId: kamarTersedia[0]?.id ?? 0,
				tanggalMasuk: new Date().toISOString().split('T')[0],
				hargaDisepakati: kamarTersedia[0]?.harga ?? 0,
				deposit: 0,
				tanggalSelesai: ''
			};
			modalSewa = true;
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat pilihan sewa', true);
		}
	}

	function saatPilihKamar(kamarId: number) {
		const k = kamarKosong.find((x) => x.id === kamarId);
		if (k) form.hargaDisepakati = k.harga;
	}

	async function simpanSewa(e: Event) {
		e.preventDefault();
		if (!form.userId || !form.kamarId) return;
		simpanMemuat = true;
		try {
			await createSewa({
				userId: Number(form.userId),
				kamarId: Number(form.kamarId),
				tanggalMasuk: form.tanggalMasuk,
				hargaDisepakati: Number(form.hargaDisepakati),
				deposit: Number(form.deposit || 0),
				tanggalSelesai: form.tanggalSelesai || undefined
			});
			onNotify('Penghuni berhasil ditempatkan ke kamar.');
			modalSewa = false;
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal membuat sewa', true);
		} finally {
			simpanMemuat = false;
		}
	}

	async function akhiri(s: SewaItem) {
		const nama = s.user?.nama ?? s.nama ?? 'penghuni';
		if (!confirm(`Akhiri sewa atas nama ${nama} (Kamar ${s.kamar?.kode ?? s.kamarId})?`)) return;
		try {
			await akhiriSewa(s.id);
			onNotify('Sewa diakhiri, kamar kembali berstatus tersedia.');
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal mengakhiri sewa', true);
		}
	}

	const inputCls =
		'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
</script>

<div class="space-y-5">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-xl font-extrabold text-gray-900">Penghuni &amp; Kontrak Sewa</h2>
			<p class="text-sm text-gray-500">Tempatkan calon penghuni ke kamar tersedia atau akhiri kontrak sewa.</p>
		</div>
		<button onclick={bukaTempatkan} class="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-dark">
			+ Tempatkan Penghuni
		</button>
	</div>

	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex gap-2">
			<button onclick={() => (subtab = 'sewa')} class="rounded-full px-4 py-1.5 text-xs font-bold {subtab === 'sewa' ? 'bg-brand text-white' : 'bg-white text-gray-700 ring-1 ring-black/10'}">Kontrak Sewa ({sewaList.length})</button>
			<button onclick={() => (subtab = 'penghuni')} class="rounded-full px-4 py-1.5 text-xs font-bold {subtab === 'penghuni' ? 'bg-brand text-white' : 'bg-white text-gray-700 ring-1 ring-black/10'}">Daftar Akun Penghuni ({penghuniList.length})</button>
		</div>

		{#if subtab === 'sewa'}
			<div class="flex gap-2">
				{#each [{ l: 'Aktif', v: 'aktif' }, { l: 'Selesai', v: 'selesai' }, { l: 'Semua', v: '' }] as f (f.l)}
					<button onclick={() => (filterSewa = f.v)} class="rounded-full border px-3 py-1 text-xs font-semibold {filterSewa === f.v ? 'border-brand bg-brand/10 text-brand' : 'border-gray-200 bg-white text-gray-600'}">{f.l}</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if memuat}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat data…</div>
	{:else if subtab === 'sewa'}
		{#if sewaList.length === 0}
			<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Tidak ada data sewa.</div>
		{:else}
			<div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
				<div class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead class="border-b bg-cream/60 text-xs font-bold text-gray-600">
							<tr>
								<th class="px-4 py-3">Penghuni</th>
								<th class="px-4 py-3">Kamar</th>
								<th class="px-4 py-3">Harga</th>
								<th class="px-4 py-3">Masa Sewa</th>
								<th class="px-4 py-3">Status</th>
								<th class="px-4 py-3 text-right">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each sewaList as s (s.id)}
								<tr class="hover:bg-cream/30">
									<td class="px-4 py-3">
										<p class="font-semibold text-gray-900">{s.user?.nama ?? s.nama}</p>
										<p class="text-xs text-gray-500">{s.user?.noHp || s.noHp || '-'}</p>
									</td>
									<td class="px-4 py-3 font-medium">Kamar {s.kamar?.kode ?? s.kamarId}</td>
									<td class="px-4 py-3 font-semibold text-brand">{rupiah(s.hargaDisepakati)}</td>
									<td class="px-4 py-3 text-xs text-gray-600">{formatTanggal(s.tanggalMulai)} – {formatTanggal(s.tanggalSelesai)}</td>
									<td class="px-4 py-3">
										<span class="rounded-full px-2.5 py-0.5 text-xs font-bold capitalize {s.status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}">{s.status}</span>
									</td>
									<td class="px-4 py-3 text-right">
										{#if s.status === 'aktif'}
											<button onclick={() => akhiri(s)} class="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Akhiri Sewa</button>
										{:else}
											<span class="text-xs text-gray-400">Selesai</span>
										{/if}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each penghuniList as p (p.id)}
				<div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
					<div class="flex items-start justify-between gap-2">
						<div>
							<h3 class="font-bold text-gray-900">{p.nama}</h3>
							<p class="text-xs text-gray-500">{p.email}</p>
							<p class="text-xs text-gray-500">{p.noHp || '-'}</p>
						</div>
						<span class="rounded-full bg-cream px-2.5 py-0.5 text-[11px] font-semibold text-brand">{p.role}</span>
					</div>
					<div class="mt-3 border-t pt-2.5 text-xs">
						{#if p.kamar}
							<span class="font-semibold text-emerald-700">Menghuni Kamar {p.kamar.kode} ({p.kamar.tipe})</span>
						{:else}
							<span class="text-gray-400">Belum menempati kamar</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if modalSewa}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
		<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (modalSewa = false)}></button>
		<form onsubmit={simpanSewa} class="relative w-full max-w-md space-y-3 rounded-3xl bg-white p-6 shadow-2xl">
			<h3 class="text-lg font-extrabold text-brand">Tempatkan Penghuni ke Kamar</h3>
			{#if calonPenghuni.length === 0 || kamarKosong.length === 0}
				<p class="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
					{calonPenghuni.length === 0 ? 'Semua akun penghuni sudah memiliki kamar aktif.' : 'Tidak ada kamar tersedia saat ini.'}
				</p>
				<button type="button" onclick={() => (modalSewa = false)} class="w-full rounded-full border py-2.5 text-sm font-semibold">Tutup</button>
			{:else}
				<label class="block text-xs font-semibold text-gray-600">Pilih Penghuni / Calon
					<select bind:value={form.userId} class="mt-1 {inputCls}">
						{#each calonPenghuni as c (c.id)}<option value={c.id}>{c.nama} ({c.email})</option>{/each}
					</select>
				</label>
				<label class="block text-xs font-semibold text-gray-600">Pilih Kamar Tersedia
					<select bind:value={form.kamarId} onchange={() => saatPilihKamar(form.kamarId)} class="mt-1 {inputCls}">
						{#each kamarKosong as k (k.id)}<option value={k.id}>Kamar {k.kode} · {k.tipe} ({rupiah(k.harga)})</option>{/each}
					</select>
				</label>
				<div class="grid grid-cols-2 gap-3">
					<label class="block text-xs font-semibold text-gray-600">Harga Disepakati<input bind:value={form.hargaDisepakati} type="number" required class="mt-1 {inputCls}" /></label>
					<label class="block text-xs font-semibold text-gray-600">Deposit<input bind:value={form.deposit} type="number" min="0" class="mt-1 {inputCls}" /></label>
				</div>
				<div class="grid grid-cols-2 gap-3">
					<label class="block text-xs font-semibold text-gray-600">Tanggal Masuk<input bind:value={form.tanggalMasuk} type="date" required class="mt-1 {inputCls}" /></label>
					<label class="block text-xs font-semibold text-gray-600">Tanggal Selesai (opsional)<input bind:value={form.tanggalSelesai} type="date" class="mt-1 {inputCls}" /></label>
				</div>
				<div class="flex gap-3 pt-2">
					<button type="button" onclick={() => (modalSewa = false)} class="flex-1 rounded-full border py-2.5 text-sm font-semibold text-gray-700">Batal</button>
					<button disabled={simpanMemuat} class="flex-1 rounded-full bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60">
						{simpanMemuat ? 'Memproses…' : 'Simpan Sewa'}
					</button>
				</div>
			{/if}
		</form>
	</div>
{/if}

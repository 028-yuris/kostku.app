<script lang="ts">
	import {
		aset,
		createKamar,
		deleteKamar,
		getKamar,
		getSemuaKamar,
		rupiah,
		updateKamar,
		uploadFotoKamar,
		type Kamar
	} from '../../api';

	let { onNotify, onRefreshSummary }: { onNotify: (msg: string, err?: boolean) => void; onRefreshSummary: () => void } =
		$props();

	let daftar = $state<Kamar[]>([]);
	let memuat = $state(true);
	let filterStatus = $state('');

	let modal = $state<'tambah' | 'edit' | null>(null);
	let simpanMemuat = $state(false);
	let editId = $state<number | null>(null);
	let form = $state({
		kode: '',
		lantai: 1,
		luas: '3x4 m',
		tipe: 'Standard',
		harga: 1200000,
		status: 'tersedia',
		fasilitas: 'Kasur, Lemari, Wi-Fi',
		deskripsi: ''
	});
	let fileFoto = $state<File | null>(null);

	let detail = $state<Kamar | null>(null);
	let uploadMemuat = $state(false);

	async function muat() {
		memuat = true;
		try {
			daftar = await getSemuaKamar(filterStatus || undefined);
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat kamar', true);
		} finally {
			memuat = false;
		}
	}

	$effect(() => {
		filterStatus;
		muat();
	});

	function bukaTambah() {
		editId = null;
		fileFoto = null;
		form = {
			kode: '',
			lantai: 1,
			luas: '3x4 m',
			tipe: 'Standard',
			harga: 1200000,
			status: 'tersedia',
			fasilitas: 'Kasur, Lemari, Wi-Fi',
			deskripsi: ''
		};
		modal = 'tambah';
	}

	function bukaEdit(k: Kamar) {
		editId = k.id;
		fileFoto = null;
		form = {
			kode: k.kode,
			lantai: k.lantai,
			luas: k.luas,
			tipe: k.tipe,
			harga: k.harga,
			status: k.status,
			fasilitas: k.fasilitas.join(', '),
			deskripsi: k.deskripsi
		};
		modal = 'edit';
	}

	async function simpan(e: Event) {
		e.preventDefault();
		simpanMemuat = true;
		try {
			const fasilitasArr = form.fasilitas
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean);

			if (modal === 'tambah') {
				if (fileFoto) {
					const fd = new FormData();
					fd.append('kode', form.kode);
					fd.append('lantai', String(form.lantai));
					fd.append('luas', form.luas);
					fd.append('tipe', form.tipe);
					fd.append('harga', String(form.harga));
					fd.append('status', form.status);
					fd.append('fasilitas', JSON.stringify(fasilitasArr));
					fd.append('deskripsi', form.deskripsi);
					fd.append('foto', fileFoto);
					await createKamar(fd);
				} else {
					await createKamar({ ...form, fasilitas: fasilitasArr });
				}
				onNotify('Kamar berhasil ditambahkan.');
			} else if (editId) {
				await updateKamar(editId, { ...form, fasilitas: fasilitasArr });
				if (fileFoto) await uploadFotoKamar(editId, fileFoto);
				onNotify('Data kamar berhasil diperbarui.');
			}
			modal = null;
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal menyimpan kamar', true);
		} finally {
			simpanMemuat = false;
		}
	}

	async function hapus(k: Kamar) {
		if (!confirm(`Hapus kamar ${k.kode}?`)) return;
		try {
			await deleteKamar(k.id);
			onNotify(`Kamar ${k.kode} dihapus.`);
			await muat();
			onRefreshSummary();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal menghapus kamar', true);
		}
	}

	async function bukaDetail(k: Kamar) {
		detail = k;
		try {
			detail = await getKamar(k.id);
		} catch {
			/* pakai data awal */
		}
	}

	async function unggahFotoTambahan(e: Event) {
		const input = e.target as HTMLInputElement;
		const f = input.files?.[0];
		if (!f || !detail) return;
		uploadMemuat = true;
		try {
			const res = await uploadFotoKamar(detail.id, f);
			detail = { ...detail, foto: res.foto };
			onNotify('Foto kamar berhasil diunggah.');
			await muat();
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal unggah foto', true);
		} finally {
			uploadMemuat = false;
			input.value = '';
		}
	}

	const badgeStatus = (s: string) => {
		const st = s.toLowerCase();
		if (st === 'tersedia' || st === 'kosong') return 'bg-emerald-500 text-white';
		if (st === 'terisi') return 'bg-brand text-white';
		return 'bg-amber-500 text-white';
	};

	const inputCls =
		'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
</script>

<div class="space-y-5">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-xl font-extrabold text-gray-900">Kelola Data Kamar</h2>
			<p class="text-sm text-gray-500">Tambah, ubah harga/fasilitas, unggah foto, atau hapus kamar kosong.</p>
		</div>
		<button onclick={bukaTambah} class="self-start rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-dark">
			+ Tambah Kamar
		</button>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each [{ l: 'Semua', v: '' }, { l: 'Tersedia', v: 'tersedia' }, { l: 'Terisi', v: 'terisi' }, { l: 'Perawatan', v: 'perawatan' }] as f (f.l)}
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
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat data kamar…</div>
	{:else if daftar.length === 0}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Belum ada kamar pada filter ini.</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each daftar as k (k.id)}
				<div class="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
					<button onclick={() => bukaDetail(k)} class="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-cream text-left">
						{#if k.foto?.[0]}
							<img src={aset(k.foto[0])} alt={`Kamar ${k.kode}`} class="h-full w-full object-cover" />
						{:else}
							<div class="flex h-full w-full items-center justify-center text-xs text-gray-400">Belum ada foto</div>
						{/if}
						<div class="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
							<span class="rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-brand shadow">{k.tipe}</span>
							<span class="rounded-full px-2.5 py-0.5 text-xs font-bold capitalize shadow {badgeStatus(k.status)}">{k.status}</span>
						</div>
					</button>
					<div class="flex flex-1 flex-col p-4">
						<div class="flex items-baseline justify-between gap-2">
							<h3 class="truncate font-bold text-gray-900">Kamar {k.kode}</h3>
							<span class="shrink-0 text-xs text-gray-500">Lt. {k.lantai} · {k.luas || '-'}</span>
						</div>
						<p class="mt-1 line-clamp-2 text-xs text-gray-500">{k.deskripsi || 'Tidak ada deskripsi'}</p>
						<p class="mt-2 text-base font-extrabold text-brand">{rupiah(k.harga)}<span class="text-xs font-normal text-gray-500">/bln</span></p>
						<div class="mt-3 flex flex-wrap gap-1">
							{#each k.fasilitas.slice(0, 3) as fas (fas)}
								<span class="rounded-full bg-cream px-2 py-0.5 text-[11px] text-gray-700">{fas}</span>
							{/each}
							{#if k.fasilitas.length > 3}
								<span class="rounded-full bg-cream px-2 py-0.5 text-[11px] text-gray-500">+{k.fasilitas.length - 3}</span>
							{/if}
						</div>
						<div class="mt-auto flex flex-wrap gap-2 pt-4">
							<button onclick={() => bukaEdit(k)} class="flex-1 rounded-full border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white">Ubah</button>
							<button onclick={() => bukaDetail(k)} class="flex-1 whitespace-nowrap rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200">Foto &amp; Detail</button>
							<button onclick={() => hapus(k)} class="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Hapus</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if modal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
		<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (modal = null)}></button>
		<form onsubmit={simpan} class="relative max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
			<h3 class="text-lg font-extrabold text-brand">{modal === 'tambah' ? 'Tambah Kamar Baru' : `Ubah Kamar ${form.kode}`}</h3>
			<div class="grid grid-cols-2 gap-3">
				<label class="block text-xs font-semibold text-gray-600">Kode Kamar<input bind:value={form.kode} required placeholder="mis. 204" class="mt-1 {inputCls}" /></label>
				<label class="block text-xs font-semibold text-gray-600">Lantai<input bind:value={form.lantai} type="number" min="1" required class="mt-1 {inputCls}" /></label>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<label class="block text-xs font-semibold text-gray-600">Tipe
					<select bind:value={form.tipe} class="mt-1 {inputCls}">
						<option value="Standard">Standard</option>
						<option value="Deluxe">Deluxe</option>
						<option value="VIP">VIP</option>
					</select>
				</label>
				<label class="block text-xs font-semibold text-gray-600">Luas<input bind:value={form.luas} placeholder="3x4 m" class="mt-1 {inputCls}" /></label>
			</div>
			<div class="grid grid-cols-2 gap-3">
				<label class="block text-xs font-semibold text-gray-600">Harga / bulan<input bind:value={form.harga} type="number" min="0" required class="mt-1 {inputCls}" /></label>
				<label class="block text-xs font-semibold text-gray-600">Status
					<select bind:value={form.status} class="mt-1 {inputCls}">
						<option value="tersedia">Tersedia</option>
						<option value="terisi">Terisi</option>
						<option value="perawatan">Perawatan</option>
					</select>
				</label>
			</div>
			<label class="block text-xs font-semibold text-gray-600">Fasilitas (pisahkan dengan koma)
				<input bind:value={form.fasilitas} placeholder="AC, Wi-Fi, Kamar Mandi Dalam" class="mt-1 {inputCls}" />
			</label>
			<label class="block text-xs font-semibold text-gray-600">Deskripsi
				<textarea bind:value={form.deskripsi} rows="2" class="mt-1 {inputCls}"></textarea>
			</label>
			<label class="block text-xs font-semibold text-gray-600">{modal === 'tambah' ? 'Foto Kamar (opsional)' : 'Tambah Foto Baru (opsional)'}
				<input type="file" accept="image/*" onchange={(e) => (fileFoto = (e.target as HTMLInputElement).files?.[0] ?? null)} class="mt-1 block w-full text-xs text-gray-600" />
			</label>
			<div class="flex gap-3 pt-2">
				<button type="button" onclick={() => (modal = null)} class="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-semibold text-gray-700">Batal</button>
				<button disabled={simpanMemuat} class="flex-1 rounded-full bg-accent py-2.5 text-sm font-bold text-white hover:bg-accent-dark disabled:opacity-60">
					{simpanMemuat ? 'Menyimpan…' : 'Simpan'}
				</button>
			</div>
		</form>
	</div>
{/if}

{#if detail}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
		<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (detail = null)}></button>
		<div class="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="text-xl font-extrabold text-gray-900">Kamar {detail.kode} · {detail.tipe}</h3>
					<p class="text-sm text-gray-500">Lantai {detail.lantai} · {detail.luas || '-'} · {rupiah(detail.harga)}/bln</p>
				</div>
				<button onclick={() => (detail = null)} class="text-2xl text-gray-400 hover:text-gray-600" aria-label="Tutup">×</button>
			</div>
			<div class="mt-4 grid grid-cols-2 gap-2">
				{#each detail.foto as f (f)}
					<img src={aset(f)} alt={`Foto kamar ${detail.kode}`} class="aspect-[4/3] w-full rounded-xl object-cover" />
				{/each}
			</div>
			<label class="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
				{uploadMemuat ? 'Mengunggah…' : '+ Unggah Foto Kamar'}
				<input type="file" accept="image/*" class="hidden" disabled={uploadMemuat} onchange={unggahFotoTambahan} />
			</label>
			<p class="mt-4 text-sm text-gray-700">{detail.deskripsi || 'Tidak ada deskripsi.'}</p>
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#each detail.fasilitas as f (f)}<span class="rounded-full bg-cream px-3 py-1 text-xs font-medium text-gray-700">{f}</span>{/each}
			</div>
		</div>
	</div>
{/if}

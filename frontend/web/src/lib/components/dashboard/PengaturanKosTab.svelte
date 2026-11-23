<script lang="ts">
	import { onMount } from 'svelte';
	import { getKos, updateKos } from '../../api';

	let { onNotify }: { onNotify: (msg: string, err?: boolean) => void } = $props();

	let memuat = $state(true);
	let simpanMemuat = $state(false);
	let form = $state({
		nama: '',
		alamat: '',
		namaPengelola: '',
		kontakWhatsApp: '',
		telepon: '',
		jamKunjung: '',
		tanggalJatuhTempo: 10,
		bank: 'BCA',
		nomorRekening: '',
		atasNama: '',
		deskripsi: '',
		aturanTeks: ''
	});

	onMount(async () => {
		try {
			const k = await getKos();
			form = {
				nama: k.nama || '',
				alamat: k.alamat || '',
				namaPengelola: k.namaPengelola || '',
				kontakWhatsApp: k.kontakWhatsApp || k.telepon || '',
				telepon: k.telepon || '',
				jamKunjung: k.jamKunjung || '',
				tanggalJatuhTempo: k.tanggalJatuhTempo || 10,
				bank: k.rekening?.bank || 'BCA',
				nomorRekening: k.rekening?.nomorRekening || '',
				atasNama: k.rekening?.atasNama || '',
				deskripsi: k.deskripsi || '',
				aturanTeks: (k.aturan || []).join('\n')
			};
		} catch (e) {
			onNotify(e instanceof Error ? e.message : 'Gagal memuat info kos', true);
		} finally {
			memuat = false;
		}
	});

	async function simpan(e: Event) {
		e.preventDefault();
		simpanMemuat = true;
		try {
			await updateKos({
				nama: form.nama,
				alamat: form.alamat,
				namaPengelola: form.namaPengelola,
				kontakWhatsApp: form.kontakWhatsApp,
				telepon: form.telepon,
				jamKunjung: form.jamKunjung,
				tanggalJatuhTempo: Number(form.tanggalJatuhTempo),
				rekening: {
					bank: form.bank,
					nomorRekening: form.nomorRekening,
					atasNama: form.atasNama
				},
				deskripsi: form.deskripsi,
				aturan: form.aturanTeks
					.split('\n')
					.map((s) => s.trim())
					.filter(Boolean)
			});
			onNotify('Pengaturan kos berhasil disimpan.');
		} catch (err) {
			onNotify(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan', true);
		} finally {
			simpanMemuat = false;
		}
	}

	const inputCls =
		'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
</script>

<div class="space-y-5">
	<div>
		<h2 class="text-xl font-extrabold text-gray-900">Pengaturan Info Kos</h2>
		<p class="text-sm text-gray-500">Perbarui profil kos, kontak pengelola, rekening transfer, tanggal jatuh tempo, dan aturan kos.</p>
	</div>

	{#if memuat}
		<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat informasi kos…</div>
	{:else}
		<form onsubmit={simpan} class="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
			<div class="grid gap-4 sm:grid-cols-2">
				<label class="block text-xs font-semibold text-gray-600">Nama Kos<input bind:value={form.nama} required class={inputCls} /></label>
				<label class="block text-xs font-semibold text-gray-600">Nama Pengelola<input bind:value={form.namaPengelola} required class={inputCls} /></label>
				<label class="block text-xs font-semibold text-gray-600">Kontak WhatsApp<input bind:value={form.kontakWhatsApp} required class={inputCls} /></label>
				<label class="block text-xs font-semibold text-gray-600">Telepon<input bind:value={form.telepon} class={inputCls} /></label>
				<label class="block text-xs font-semibold text-gray-600">Jam Kunjung<input bind:value={form.jamKunjung} class={inputCls} /></label>
				<label class="block text-xs font-semibold text-gray-600">Tanggal Jatuh Tempo (1–31)<input bind:value={form.tanggalJatuhTempo} type="number" min="1" max="31" required class={inputCls} /></label>
			</div>

			<label class="block text-xs font-semibold text-gray-600">Alamat Lengkap<input bind:value={form.alamat} required class={inputCls} /></label>
			<label class="block text-xs font-semibold text-gray-600">Deskripsi Kos<textarea bind:value={form.deskripsi} rows="2" class={inputCls}></textarea></label>

			<div class="rounded-2xl bg-cream/60 p-4">
				<h3 class="text-sm font-bold text-brand">Rekening Pembayaran</h3>
				<div class="mt-3 grid gap-3 sm:grid-cols-3">
					<label class="block text-xs font-semibold text-gray-600">Bank<input bind:value={form.bank} class={inputCls} /></label>
					<label class="block text-xs font-semibold text-gray-600">Nomor Rekening<input bind:value={form.nomorRekening} class={inputCls} /></label>
					<label class="block text-xs font-semibold text-gray-600">Atas Nama<input bind:value={form.atasNama} class={inputCls} /></label>
				</div>
			</div>

			<label class="block text-xs font-semibold text-gray-600">Aturan Kos (satu aturan per baris)
				<textarea bind:value={form.aturanTeks} rows="4" class={inputCls}></textarea>
			</label>

			<div class="flex justify-end">
				<button disabled={simpanMemuat} class="rounded-full bg-accent px-7 py-2.5 text-sm font-bold text-white shadow-sm shadow-accent/30 hover:bg-accent-dark disabled:opacity-60">
					{simpanMemuat ? 'Menyimpan…' : 'Simpan Pengaturan'}
				</button>
			</div>
		</form>
	{/if}
</div>

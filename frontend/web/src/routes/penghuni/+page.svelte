<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		bacaNotifikasi,
		bacaSemuaNotifikasi,
		formatTanggal,
		getKos,
		getMe,
		getNotifikasi,
		getNotifikasiBelumDibaca,
		getPembayaranSaya,
		getTagihanSaya,
		getTiketSaya,
		login,
		rupiah,
		type Kos,
		type NotifikasiItem,
		type PembayaranSayaItem,
		type TagihanSayaItem,
		type TiketItem,
		type User
	} from '../../lib/api';
	import InfoKosTab from '../../lib/components/penghuni/InfoKosTab.svelte';
	import PembayaranSayaTab from '../../lib/components/penghuni/PembayaranSayaTab.svelte';
	import TagihanSayaTab from '../../lib/components/penghuni/TagihanSayaTab.svelte';
	import TiketSayaTab from '../../lib/components/penghuni/TiketSayaTab.svelte';

	type TabId = 'ringkasan' | 'tagihan' | 'pembayaran' | 'tiket' | 'kos';

	let cekAuth = $state(true);
	let user = $state<User | null>(null);
	let email = $state('');
	let password = $state('');
	let loginMemuat = $state(false);
	let loginGalat = $state('');

	let tab = $state<TabId>('ringkasan');
	let ringkasanMemuat = $state(false);
	let tagihanList = $state<TagihanSayaItem[]>([]);
	let pembayaranList = $state<PembayaranSayaItem[]>([]);
	let tiketList = $state<TiketItem[]>([]);
	let kosInfo = $state<Kos | null>(null);

	// Notifikasi
	let notifTerbuka = $state(false);
	let notifList = $state<NotifikasiItem[]>([]);
	let belumDibaca = $state(0);

	// Toast
	let toastMsg = $state('');
	let toastErr = $state(false);

	function notify(msg: string, err = false) {
		toastMsg = msg;
		toastErr = err;
		setTimeout(() => {
			if (toastMsg === msg) toastMsg = '';
		}, 3800);
	}

	async function muatRingkasan() {
		ringkasanMemuat = true;
		try {
			const [tg, pb, tk, nb, ks] = await Promise.all([
				getTagihanSaya(),
				getPembayaranSaya(),
				getTiketSaya(),
				getNotifikasiBelumDibaca(),
				getKos()
			]);
			tagihanList = tg;
			pembayaranList = pb;
			tiketList = tk;
			belumDibaca = nb.belumDibaca;
			kosInfo = ks;
		} catch (e) {
			notify(e instanceof Error ? e.message : 'Gagal memuat ringkasan', true);
		} finally {
			ringkasanMemuat = false;
		}
	}

	// Ringkasan kalkulasi dari endpoint penghuni
	const tagihanAktif = $derived(
		tagihanList.filter((t) => t.status === 'belum_bayar' || t.status === 'belum_lunas')
	);
	const totalTagihanAktif = $derived(tagihanAktif.reduce((s, t) => s + (Number(t.nominal) || 0), 0));
	const tagihanTerlambat = $derived(tagihanAktif.filter((t) => t.terlambat).length);
	const jatuhTempoTerdekat = $derived(
		[...tagihanAktif].sort((a, b) => new Date(a.jatuhTempo).getTime() - new Date(b.jatuhTempo).getTime())[0] ?? null
	);
	const menungguVerifikasi = $derived(
		tagihanList.filter((t) => t.status === 'menunggu_verifikasi').length
	);
	const tiketCounts = $derived({
		total: tiketList.length,
		pending: tiketList.filter((t) => t.status === 'pending').length,
		diproses: tiketList.filter((t) => t.status === 'diproses').length,
		selesai: tiketList.filter((t) => t.status === 'selesai').length
	});

	async function bukaNotifikasi() {
		notifTerbuka = !notifTerbuka;
		if (notifTerbuka) {
			try {
				notifList = await getNotifikasi();
			} catch {
				/* abaikan */
			}
		}
	}

	async function tandaiBaca(n: NotifikasiItem) {
		if (n.dibaca) return;
		try {
			await bacaNotifikasi(n.id);
			n.dibaca = true;
			belumDibaca = Math.max(0, belumDibaca - 1);
		} catch {
			/* abaikan */
		}
	}

	async function tandaiSemuaBaca() {
		try {
			await bacaSemuaNotifikasi();
			notifList = notifList.map((n) => ({ ...n, dibaca: true }));
			belumDibaca = 0;
		} catch {
			/* abaikan */
		}
	}

	onMount(async () => {
		const token = localStorage.getItem('kostku_token');
		if (!token) {
			cekAuth = false;
			return;
		}
		try {
			const me = await getMe();
			if (me.role !== 'penghuni') {
				loginGalat = 'Akun ini bukan penghuni kos. Silakan masuk dengan akun penghuni.';
			} else {
				user = me;
				localStorage.setItem('kostku_user', JSON.stringify(me));
				await muatRingkasan();
			}
		} catch {
			localStorage.removeItem('kostku_token');
			localStorage.removeItem('kostku_user');
		} finally {
			cekAuth = false;
		}
	});

	async function masuk(e: Event) {
		e.preventDefault();
		loginMemuat = true;
		loginGalat = '';
		try {
			const res = await login(email, password);
			if (res.user.role !== 'penghuni') {
				loginGalat = 'Akses ditolak: halaman ini khusus untuk akun penghuni kos.';
				return;
			}
			localStorage.setItem('kostku_token', res.token);
			localStorage.setItem('kostku_user', JSON.stringify(res.user));
			user = res.user;
			await muatRingkasan();
		} catch (err) {
			loginGalat = err instanceof Error ? err.message : 'Login gagal';
		} finally {
			loginMemuat = false;
		}
	}

	function keluar() {
		user = null;
		tagihanList = [];
		pembayaranList = [];
		tiketList = [];
		localStorage.removeItem('kostku_token');
		localStorage.removeItem('kostku_user');
		goto('/');
	}

	const tabs: { id: TabId; label: string; d: string }[] = [
		{ id: 'ringkasan', label: 'Ringkasan', d: 'M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-18v6h8V3h-8z' },
		{ id: 'tagihan', label: 'Tagihan Saya', d: 'M6 2h12v20l-3-2-3 2-3-2-3 2V2zm3 6h6m-6 4h6m-6 4h4' },
		{ id: 'pembayaran', label: 'Pembayaran', d: 'M3 6h18v12H3V6zm0 4h18m-13 4h4' },
		{ id: 'tiket', label: 'Tiket Masalah', d: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2-2z' },
		{ id: 'kos', label: 'Info Kos', d: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' }
	];
</script>

<svelte:head>
	<title>Dashboard Penghuni · KostKu</title>
</svelte:head>

{#snippet logo()}
	<span class="flex items-center gap-2 text-xl font-extrabold tracking-tight text-brand">
		<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white">
			<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" stroke="#f9a65a" />
			</svg>
		</span>
		KostKu
	</span>
{/snippet}

{#if cekAuth}
	<div class="flex min-h-screen items-center justify-center text-sm text-gray-500">Memeriksa sesi penghuni…</div>
{:else if !user}
	<!-- ===== Gerbang Login Penghuni ===== -->
	<main class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-[#2a97a5] p-4">
		<div class="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
			<div class="flex items-center justify-between">
				{@render logo()}
				<a href="/" class="text-xs font-semibold text-brand hover:underline">← Beranda</a>
			</div>
			<h1 class="mt-5 text-xl font-extrabold text-gray-900">Masuk Dashboard Penghuni</h1>
			<p class="mt-1 text-sm text-gray-500">Cek tagihan sewa, unggah bukti transfer, dan laporkan keluhan kamar Anda.</p>

			<form onsubmit={masuk} class="mt-5 space-y-3">
				<input bind:value={email} type="email" required placeholder="Email penghuni" class="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
				<input bind:value={password} type="password" required placeholder="Password" class="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
				{#if loginGalat}<p class="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">{loginGalat}</p>{/if}
				<button disabled={loginMemuat} class="w-full rounded-full bg-accent py-3 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:bg-accent-dark disabled:opacity-60">
					{loginMemuat ? 'Memproses…' : 'Masuk ke Dashboard'}
				</button>
			</form>
		</div>
	</main>
{:else}
	<div class="min-h-screen bg-cream">
		<!-- ===== Top Navbar ===== -->
		<header class="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
			<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
				<div class="flex items-center gap-4">
					<a href="/">{@render logo()}</a>
					<span class="hidden rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand sm:inline">Panel Penghuni</span>
				</div>

				<div class="flex items-center gap-3">
					<a href="/" class="hidden text-xs font-semibold text-gray-600 hover:text-brand sm:inline">Lihat Landing Page</a>

					<!-- Lonceng Notifikasi -->
					<div class="relative">
						<button onclick={bukaNotifikasi} aria-label="Notifikasi" class="relative rounded-full p-2 text-gray-700 hover:bg-cream">
							<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
							</svg>
							{#if belumDibaca > 0}
								<span class="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{belumDibaca}</span>
							{/if}
						</button>

						{#if notifTerbuka}
							<div class="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
								<div class="flex items-center justify-between border-b px-4 py-3">
									<span class="text-sm font-bold text-gray-900">Notifikasi</span>
									{#if belumDibaca > 0}
										<button onclick={tandaiSemuaBaca} class="text-xs font-semibold text-brand hover:underline">Tandai semua dibaca</button>
									{/if}
								</div>
								<ul class="max-h-72 divide-y overflow-y-auto">
									{#if notifList.length === 0}
										<li class="p-4 text-center text-xs text-gray-500">Belum ada notifikasi.</li>
									{:else}
										{#each notifList as n (n.id)}
											<li>
												<button onclick={() => tandaiBaca(n)} class="w-full px-4 py-3 text-left transition hover:bg-cream/50 {n.dibaca ? 'opacity-65' : 'bg-brand/5'}">
													<div class="flex items-center justify-between gap-2">
														<span class="text-xs font-bold text-gray-900">{n.judul}</span>
														{#if !n.dibaca}<span class="h-2 w-2 shrink-0 rounded-full bg-accent"></span>{/if}
													</div>
													<p class="mt-0.5 text-xs text-gray-600">{n.isi}</p>
													<p class="mt-1 text-[10px] text-gray-400">{formatTanggal(n.createdAt)}</p>
												</button>
											</li>
										{/each}
									{/if}
								</ul>
							</div>
						{/if}
					</div>

					<span class="hidden text-sm text-gray-700 md:inline">Halo, <b>{user.nama}</b></span>
					<button onclick={keluar} class="rounded-full border border-brand px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white">Keluar</button>
				</div>
			</div>

			<!-- Tab Bar Mobile -->
			<nav class="flex gap-1.5 overflow-x-auto border-t bg-white px-4 py-2 lg:hidden" aria-label="Menu dashboard penghuni">
				{#each tabs as t (t.id)}
					<button onclick={() => (tab = t.id)} class="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition {tab === t.id ? 'bg-brand text-white' : 'bg-cream text-gray-700'}">
						{t.label}
					</button>
				{/each}
			</nav>
		</header>

		<div class="mx-auto flex max-w-7xl gap-6 px-4 py-6">
			<!-- ===== Sidebar Desktop ===== -->
			<aside class="hidden w-60 shrink-0 lg:block">
				<nav class="sticky top-22 space-y-1 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-black/5" aria-label="Navigasi penghuni">
					{#each tabs as t (t.id)}
						<button
							onclick={() => (tab = t.id)}
							class="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold transition {tab === t.id
								? 'bg-brand text-white shadow-sm'
								: 'text-gray-700 hover:bg-cream'}"
						>
							<svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d={t.d} />
							</svg>
							{t.label}
						</button>
					{/each}
				</nav>
			</aside>

			<!-- ===== Konten Utama ===== -->
			<main class="min-w-0 flex-1">
				{#if tab === 'ringkasan'}
					<div class="space-y-6">
						<div class="rounded-3xl bg-gradient-to-br from-brand-dark via-brand to-[#2a97a5] p-6 text-white shadow-md">
							<h1 class="text-2xl font-extrabold">Selamat Datang, {user.nama}</h1>
							<p class="mt-1 text-sm text-white/80">
								{kosInfo ? `${kosInfo.nama} · ${kosInfo.alamat}` : 'Pantau tagihan bulanan, riwayat pembayaran, dan laporan kerusakan Anda.'}
							</p>
						</div>

						{#if ringkasanMemuat && tagihanList.length === 0}
							<div class="rounded-2xl bg-white p-8 text-center text-sm text-gray-500 shadow-sm">Memuat ringkasan…</div>
						{:else}
							<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
								<button onclick={() => (tab = 'tagihan')} class="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-xs font-semibold text-gray-500">Tagihan Belum Dibayar</p>
									<p class="mt-2 text-2xl font-extrabold {tagihanAktif.length > 0 ? 'text-accent' : 'text-emerald-600'}">{rupiah(totalTagihanAktif)}</p>
									<p class="mt-1 text-xs {tagihanTerlambat > 0 ? 'font-semibold text-red-600' : 'text-gray-500'}">
										{tagihanAktif.length} tagihan aktif{tagihanTerlambat > 0 ? ` (${tagihanTerlambat} terlambat)` : ''}
									</p>
								</button>

								<button onclick={() => (tab = 'tagihan')} class="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-xs font-semibold text-gray-500">Jatuh Tempo Terdekat</p>
									<p class="mt-2 text-2xl font-extrabold text-brand">
										{jatuhTempoTerdekat ? formatTanggal(jatuhTempoTerdekat.jatuhTempo) : 'Semua Lunas'}
									</p>
									<p class="mt-1 text-xs text-gray-500">
										{jatuhTempoTerdekat ? `Periode ${jatuhTempoTerdekat.bulan || jatuhTempoTerdekat.periode}` : `${menungguVerifikasi} menunggu verifikasi`}
									</p>
								</button>

								<button onclick={() => (tab = 'pembayaran')} class="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-xs font-semibold text-gray-500">Riwayat Pembayaran</p>
									<p class="mt-2 text-2xl font-extrabold text-gray-900">{pembayaranList.length}</p>
									<p class="mt-1 text-xs text-emerald-600">
										{pembayaranList.filter((p) => p.status === 'diterima').length} diterima · {menungguVerifikasi} menunggu
									</p>
								</button>

								<button onclick={() => (tab = 'tiket')} class="rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md">
									<p class="text-xs font-semibold text-gray-500">Tiket Laporan</p>
									<p class="mt-2 text-2xl font-extrabold text-gray-900">{tiketCounts.total}</p>
									<p class="mt-1 text-xs text-gray-500">{tiketCounts.pending} pending · {tiketCounts.diproses} diproses · {tiketCounts.selesai} selesai</p>
								</button>
							</div>

							<!-- Aksi Cepat Penghuni -->
							<div class="grid gap-4 lg:grid-cols-2">
								{#if jatuhTempoTerdekat}
									<div class="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
										<div>
											<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">Perlu Dibayar</span>
											<h2 class="mt-2 text-base font-extrabold text-gray-900">Tagihan {jatuhTempoTerdekat.bulan || jatuhTempoTerdekat.periode}</h2>
											<p class="mt-0.5 text-xs text-gray-500">
												Kamar {jatuhTempoTerdekat.kamar?.kode ?? jatuhTempoTerdekat.kamarId} · Jatuh tempo {formatTanggal(jatuhTempoTerdekat.jatuhTempo)}
											</p>
											<p class="mt-2 text-xl font-extrabold text-brand">{rupiah(jatuhTempoTerdekat.nominal)}</p>
										</div>
										<button onclick={() => (tab = 'tagihan')} class="mt-4 self-start rounded-full bg-accent px-5 py-2 text-xs font-bold text-white hover:bg-accent-dark">
											Bayar &amp; Unggah Bukti →
										</button>
									</div>
								{/if}

								{#if kosInfo?.rekening}
									<div class="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
										<div>
											<span class="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-bold text-brand">Rekening Transfer Kos</span>
											<h2 class="mt-2 text-base font-extrabold text-gray-900">{kosInfo.rekening.bank} · {kosInfo.rekening.nomorRekening}</h2>
											<p class="mt-0.5 text-xs text-gray-500">a.n. {kosInfo.rekening.atasNama}</p>
										</div>
										<button onclick={() => (tab = 'kos')} class="mt-4 self-start rounded-full border border-brand px-5 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
											Lihat Info &amp; Aturan Kos
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else if tab === 'tagihan'}
					<TagihanSayaTab onNotify={notify} onRefreshSummary={muatRingkasan} />
				{:else if tab === 'pembayaran'}
					<PembayaranSayaTab onNotify={notify} />
				{:else if tab === 'tiket'}
					<TiketSayaTab onNotify={notify} onRefreshSummary={muatRingkasan} />
				{:else if tab === 'kos'}
					<InfoKosTab onNotify={notify} />
				{/if}
			</main>
		</div>
	</div>

	{#if toastMsg}
		<div class="fixed bottom-5 right-5 z-[90] max-w-sm rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-xl {toastErr ? 'bg-red-600' : 'bg-gray-900'}" role="status">
			{toastMsg}
		</div>
	{/if}
{/if}

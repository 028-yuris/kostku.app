<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { aset, getKamar, login, register, rupiah, type Kamar, type User } from '../lib/api';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const kos = $derived(data.kos);
	const semua = $derived(data.kamar);

	// ---------- Filter (dari data kamar backend) ----------
	let kata = $state('');
	let hargaMaks = $state(0); // 0 = semua
	let tipe = $state('');
	let termurah = $state(false);
	let menuTerbuka = $state(false);

	const daftarTipe = $derived([...new Set(semua.map((k) => k.tipe))]);
	const daftarHarga = $derived([...new Set(semua.map((k) => k.harga))].sort((a, b) => a - b));

	const hasil = $derived.by(() => {
		const q = kata.trim().toLowerCase();
		let r = semua.filter((k) => {
			if (tipe && k.tipe !== tipe) return false;
			if (hargaMaks && k.harga > hargaMaks) return false;
			if (q) {
				const teks = [k.kode, k.tipe, k.deskripsi, `lantai ${k.lantai}`, kos?.alamat, ...k.fasilitas]
					.join(' ')
					.toLowerCase();
				if (!teks.includes(q)) return false;
			}
			return true;
		});
		if (termurah) r = [...r].sort((a, b) => a.harga - b.harga);
		return r;
	});
	const terfilter = $derived(Boolean(kata.trim() || hargaMaks || tipe || termurah));

	function reset() {
		kata = '';
		hargaMaks = 0;
		tipe = '';
		termurah = false;
	}

	function cari(e: Event) {
		e.preventDefault();
		document.getElementById('kamar')?.scrollIntoView({ behavior: 'smooth' });
	}

	// ---------- Detail kamar ----------
	let detail = $state<Kamar | null>(null);
	let detailMemuat = $state(false);

	async function bukaDetail(k: Kamar) {
		detail = k;
		detailMemuat = true;
		try {
			detail = await getKamar(k.id);
		} catch {
			/* tetap tampilkan data ringkas */
		} finally {
			detailMemuat = false;
		}
	}

	// ---------- Auth ----------
	let authMode = $state<'login' | 'register' | null>(null);
	let authMemuat = $state(false);
	let authGalat = $state('');
	let form = $state({ nama: '', email: '', password: '', noHp: '', role: 'penghuni' });
	let user = $state<User | null>(null);
	let pesan = $state('');

	onMount(() => {
		try {
			const u = localStorage.getItem('kostku_user');
			if (u) user = JSON.parse(u);
		} catch {
			/* abaikan */
		}
	});

	function bukaAuth(mode: 'login' | 'register', role = 'penghuni') {
		authMode = mode;
		authGalat = '';
		form = { nama: '', email: '', password: '', noHp: '', role };
		menuTerbuka = false;
	}

	function toast(t: string) {
		pesan = t;
		setTimeout(() => (pesan = ''), 3500);
	}

	async function kirimAuth(e: Event) {
		e.preventDefault();
		authMemuat = true;
		authGalat = '';
		try {
			if (authMode === 'register') {
				await register({
					nama: form.nama,
					email: form.email,
					password: form.password,
					noHp: form.noHp,
					role: form.role
				});
			}
			const res = await login(form.email, form.password);
			user = res.user;
			localStorage.setItem('kostku_user', JSON.stringify(res.user));
			localStorage.setItem('kostku_token', res.token);
			toast(
				authMode === 'register'
					? `Registrasi berhasil. Selamat datang, ${res.user.nama}!`
					: `Selamat datang kembali, ${res.user.nama}!`
			);
			authMode = null;
			if (res.user.role === 'pengelola') {
				goto('/dashboard');
			} else if (res.user.role === 'penghuni') {
				goto('/penghuni');
			}
		} catch (err) {
			authGalat = err instanceof Error ? err.message : 'Terjadi kesalahan';
		} finally {
			authMemuat = false;
		}
	}

	function keluar() {
		user = null;
		localStorage.removeItem('kostku_user');
		localStorage.removeItem('kostku_token');
		menuTerbuka = false;
		toast('Anda telah keluar.');
	}

	// ---------- Navigasi ----------
	const menu = [
		{ label: 'Beranda', target: '#beranda' },
		{ label: 'Cari Kos', target: '#cari' },
		{ label: 'Cara Kerja', target: '#cara-kerja' },
		{ label: 'Bantuan', target: 'bantuan' }
	];

	function klikNav(target: string) {
		menuTerbuka = false;
		if (target === 'bantuan') {
			if (kos?.whatsapp) window.open(kos.whatsapp, '_blank', 'noopener');
		} else {
			document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
		}
	}

	const langkah = [
		{ judul: 'Cari Kos', teks: 'Telusuri kamar yang tersedia lengkap dengan harga, fasilitas, dan foto.' },
		{ judul: 'Hubungi Pengelola', teks: 'Lihat detail kamar lalu hubungi pengelola lewat WhatsApp atau telepon.' },
		{ judul: 'Daftar & Huni', teks: 'Buat akun, bayar tagihan bulanan, dan laporkan kendala langsung dari aplikasi.' }
	];

	const ikonNav = [
		{ l: 'Beranda', t: '#beranda', d: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10' },
		{ l: 'Cari', t: '#cari', d: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.2-4.2' },
		{ l: 'Bantuan', t: 'bantuan', d: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01' }
	];

	const inputCls = 'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
</script>

<svelte:head>
	<title>{kos ? `KostKu - ${kos.nama}` : 'KostKu'}</title>
	{#if kos}<meta name="description" content={kos.deskripsi} />{/if}
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

{#if !kos}
	<main class="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
		<h1 class="text-2xl font-bold text-brand">Server tidak dapat dihubungi</h1>
		<p class="max-w-md text-gray-600">{data.error}. Pastikan backend berjalan (<code>npm run dev</code> di folder backend).</p>
		<button onclick={() => location.reload()} class="rounded-full bg-accent px-6 py-2.5 font-semibold text-white hover:bg-accent-dark">Coba Lagi</button>
	</main>
{:else}
	<div class="min-h-screen pb-20 md:pb-0">
		<!-- ===== Navbar ===== -->
		<header class="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
			<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
				<a href="#beranda" onclick={(e) => { e.preventDefault(); klikNav('#beranda'); }}>{@render logo()}</a>

				<nav class="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Menu utama">
					{#each menu as n, i (n.label)}
						<button onclick={() => klikNav(n.target)} class="relative py-1 transition hover:text-brand {i === 0 ? 'text-brand' : 'text-gray-700'}">
							{n.label}
							{#if i === 0}<span class="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-accent"></span>{/if}
						</button>
					{/each}
				</nav>

				<div class="hidden items-center gap-3 md:flex">
					{#if user}
						<span class="text-sm text-gray-600">Halo, <b class="text-gray-900">{user.nama}</b></span>
						{#if user.role === 'pengelola' || user.role === 'penghuni'}
							<a href={user.role === 'pengelola' ? '/dashboard' : '/penghuni'} class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-dark">Dashboard</a>
						{/if}
						<button onclick={keluar} class="rounded-full border border-brand px-5 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white">Keluar</button>
					{:else}
						<button onclick={() => bukaAuth('login')} class="rounded-full border border-brand px-5 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-white">Masuk</button>
						<button onclick={() => bukaAuth('register')} class="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-accent/30 transition hover:bg-accent-dark">Daftar</button>
					{/if}
				</div>

				<button class="rounded-lg p-1.5 hover:bg-gray-100 md:hidden" onclick={() => (menuTerbuka = !menuTerbuka)} aria-label="Buka menu" aria-expanded={menuTerbuka}>
					<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						{#if menuTerbuka}<path d="M6 6l12 12M18 6 6 18" />{:else}<path d="M4 6h16M4 12h16M4 18h16" />{/if}
					</svg>
				</button>
			</div>

			{#if menuTerbuka}
				<div class="border-t bg-white px-4 py-3 md:hidden">
					{#each menu as n (n.label)}
						<button onclick={() => klikNav(n.target)} class="block w-full rounded-lg px-2 py-2.5 text-left font-medium text-gray-800 hover:bg-gray-50">{n.label}</button>
					{/each}
					<div class="mt-2 flex gap-3">
						{#if user}
							{#if user.role === 'pengelola' || user.role === 'penghuni'}
								<a href={user.role === 'pengelola' ? '/dashboard' : '/penghuni'} class="flex-1 rounded-full bg-accent py-2.5 text-center font-semibold text-white">Dashboard</a>
							{/if}
							<button onclick={keluar} class="flex-1 rounded-full border border-brand py-2.5 font-semibold text-brand">Keluar ({user.nama})</button>
						{:else}
							<button onclick={() => bukaAuth('login')} class="flex-1 rounded-full border border-brand py-2.5 font-semibold text-brand">Masuk</button>
							<button onclick={() => bukaAuth('register')} class="flex-1 rounded-full bg-accent py-2.5 font-semibold text-white">Daftar</button>
						{/if}
					</div>
				</div>
			{/if}
		</header>

		<!-- ===== Hero + pencarian ===== -->
		<section id="beranda" class="relative isolate overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-[#2a97a5]">
			{#if semua[0]?.foto?.[0]}
				<img src={aset(semua[0].foto[0])} alt="" class="absolute inset-y-0 right-0 -z-10 hidden h-full w-[58%] object-cover md:block" />
				<div class="absolute inset-y-0 right-0 -z-10 hidden w-[58%] bg-gradient-to-r from-brand via-brand/50 to-transparent md:block"></div>
			{/if}
			<div class="mx-auto max-w-6xl px-4 py-10 md:py-20">
				<p class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25">
					<span class="h-1.5 w-1.5 rounded-full bg-accent"></span>{semua.length} kamar tersedia · {kos.alamat}
				</p>
				<h1 class="mt-4 max-w-lg text-3xl leading-tight font-extrabold text-white md:text-5xl">
					Temukan Kos Nyaman &amp; Terpercaya
				</h1>
				<p class="mt-3 max-w-md text-sm text-white/85 md:text-base">{kos.deskripsi}</p>

				<form id="cari" onsubmit={cari} class="mt-7 grid max-w-3xl gap-2.5 rounded-2xl bg-white p-2.5 shadow-xl shadow-black/15 md:grid-cols-[1.3fr_1fr_1fr_auto] md:rounded-full md:p-2">
					<input bind:value={kata} placeholder="Cari kamar, fasilitas, lantai…" aria-label="Kata kunci" class="rounded-xl bg-gray-50 px-4 py-3 text-sm outline-none md:rounded-full md:bg-transparent md:py-2.5" />
					<select bind:value={hargaMaks} aria-label="Harga maksimal" class="rounded-xl bg-gray-50 px-3 py-3 text-sm outline-none md:rounded-full md:bg-transparent md:py-2.5">
						<option value={0}>Harga</option>
						{#each daftarHarga as h (h)}<option value={h}>Maks. {rupiah(h)}</option>{/each}
					</select>
					<select bind:value={tipe} aria-label="Tipe kamar" class="rounded-xl bg-gray-50 px-3 py-3 text-sm outline-none md:rounded-full md:bg-transparent md:py-2.5">
						<option value="">Semua tipe</option>
						{#each daftarTipe as t (t)}<option value={t}>{t}</option>{/each}
					</select>
					<button type="submit" class="rounded-full bg-accent px-8 py-3 text-sm font-bold text-white shadow-md shadow-accent/30 transition hover:bg-accent-dark md:py-2.5">Cari Kos</button>
				</form>
			</div>
		</section>

		<main class="mx-auto max-w-6xl px-4">
			<!-- ===== Filter cepat ===== -->
			<div class="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 py-1 md:justify-center" role="group" aria-label="Filter cepat">
				{#each daftarTipe as t (t)}
					<button onclick={() => (tipe = tipe === t ? '' : t)} aria-pressed={tipe === t} class="shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition {tipe === t ? 'border-brand bg-brand text-white shadow' : 'border-brand/40 bg-white text-brand hover:border-brand'}">{t}</button>
				{/each}
				<button onclick={() => (termurah = !termurah)} aria-pressed={termurah} class="shrink-0 rounded-full border px-5 py-2 text-sm font-semibold transition {termurah ? 'border-brand bg-brand text-white shadow' : 'border-brand/40 bg-white text-brand hover:border-brand'}">Harga Termurah</button>
				{#if terfilter}
					<button onclick={reset} class="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-gray-500 underline-offset-2 hover:underline">Reset</button>
				{/if}
			</div>

			<!-- ===== Kamar tersedia ===== -->
			<section id="kamar" class="mt-8 scroll-mt-20">
				<div class="flex items-end justify-between">
					<h2 class="text-xl font-extrabold text-gray-900">{terfilter ? 'Hasil Pencarian' : 'Kamar Tersedia'}</h2>
					<span class="text-sm text-gray-500">{hasil.length} kamar</span>
				</div>

				{#if hasil.length === 0}
					<div class="mt-4 rounded-2xl bg-white p-8 text-center text-gray-500 shadow">
						Tidak ada kamar yang cocok.
						<button onclick={reset} class="ml-1 font-semibold text-brand">Reset filter</button>
					</div>
				{:else}
					<ul class="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{#each hasil as k (k.id)}
							<li>
								<button onclick={() => bukaDetail(k)} class="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
									<div class="relative overflow-hidden">
										<img src={aset(k.foto?.[0])} alt={`Kamar ${k.kode}`} loading="lazy" class="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105" />
										<span class="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand shadow">{k.tipe}</span>
										<span class="absolute top-3 right-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow capitalize">{k.status}</span>
									</div>
									<div class="flex flex-1 flex-col p-4">
										<div class="flex items-baseline justify-between gap-2">
											<h3 class="font-bold text-gray-900">Kamar {k.kode}</h3>
											<span class="text-xs text-gray-500">Lantai {k.lantai} · {k.luas}</span>
										</div>
										<p class="mt-1 line-clamp-2 text-sm text-gray-500">{k.deskripsi}</p>
										<ul class="mt-3 flex flex-wrap gap-1.5">
											{#each k.fasilitas.slice(0, 3) as f (f)}<li class="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-gray-700">{f}</li>{/each}
											{#if k.fasilitas.length > 3}<li class="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-gray-500">+{k.fasilitas.length - 3}</li>{/if}
										</ul>
										<div class="mt-auto flex items-end justify-between pt-4">
											<span class="text-lg font-extrabold text-brand">{rupiah(k.harga)}<span class="text-xs font-medium text-gray-500">/bln</span></span>
											<span class="text-sm font-semibold text-accent">Lihat detail →</span>
										</div>
									</div>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<!-- ===== Cara kerja ===== -->
			<section id="cara-kerja" class="mt-14 scroll-mt-20">
				<h2 class="text-xl font-extrabold text-gray-900">Cara Kerja</h2>
				<ol class="mt-5 grid gap-4 md:grid-cols-3">
					{#each langkah as l, i (l.judul)}
						<li class="rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5">
							<span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white">{i + 1}</span>
							<h3 class="mt-3 font-bold text-gray-900">{l.judul}</h3>
							<p class="mt-1 text-sm text-gray-500">{l.teks}</p>
						</li>
					{/each}
				</ol>
			</section>

			<!-- ===== CTA + footer ===== -->
			<section class="mt-14 mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-dark to-brand p-7 text-white md:p-10">
				<div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
					<div>
						<h2 class="text-2xl font-extrabold">Daftarkan Kos Anda</h2>
						<p class="mt-1 max-w-md text-sm text-white/80">Kelola kamar, penghuni, tagihan, dan laporan kerusakan dalam satu tempat.</p>
					</div>
					<button onclick={() => bukaAuth('register', 'pengelola')} class="self-start rounded-full bg-accent px-7 py-3 text-sm font-bold shadow-lg shadow-black/20 transition hover:bg-accent-dark md:self-auto">Mulai Sekarang</button>
				</div>
				<div class="mt-8 grid gap-1 border-t border-white/15 pt-5 text-center text-xs text-white/75 md:text-left">
					<span class="text-sm font-bold text-white">{kos.nama}</span>
					<span>{kos.alamat}</span>
					<span>Pengelola: {kos.namaPengelola} · {kos.telepon} · Kunjungan {kos.jamKunjung}</span>
				</div>
			</section>
		</main>

		<!-- ===== Navigasi bawah (mobile) ===== -->
		<nav class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white/95 py-1.5 text-[11px] backdrop-blur md:hidden" aria-label="Navigasi bawah">
			{#each ikonNav as m, i (m.l)}
				<button onclick={() => klikNav(m.t)} class="flex flex-col items-center gap-0.5 py-1 {i === 0 ? 'text-brand' : 'text-gray-500'}">
					<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={m.d} /></svg>{m.l}
				</button>
			{/each}
			<button onclick={() => (user ? keluar() : bukaAuth('login'))} class="flex flex-col items-center gap-0.5 py-1 text-gray-500">
				<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5" /></svg>{user ? 'Keluar' : 'Masuk'}
			</button>
		</nav>
	</div>

	{#if pesan}
		<div class="fixed top-20 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 text-sm text-white shadow-lg" role="status">{pesan}</div>
	{/if}

	<!-- ===== Modal detail kamar ===== -->
	{#if detail}
		<div class="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Detail kamar">
			<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (detail = null)}></button>
			<div class="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white sm:max-w-lg sm:rounded-3xl">
				<img src={aset(detail.foto?.[0])} alt={`Kamar ${detail.kode}`} class="aspect-video w-full object-cover" />
				<button onclick={() => (detail = null)} class="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-xl shadow" aria-label="Tutup">×</button>
				<div class="p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<h3 class="text-xl font-extrabold">Kamar {detail.kode} · {detail.tipe}</h3>
							<p class="text-sm text-gray-500">Lantai {detail.lantai} · {detail.luas}</p>
						</div>
						<span class="shrink-0 text-lg font-extrabold text-brand">{rupiah(detail.harga)}<span class="text-xs font-medium text-gray-500">/bln</span></span>
					</div>
					<p class="mt-3 text-sm text-gray-700">{detail.deskripsi}</p>

					<h4 class="mt-4 text-sm font-bold">Fasilitas</h4>
					<ul class="mt-2 flex flex-wrap gap-2">
						{#each detail.fasilitas as f (f)}<li class="rounded-full bg-cream px-3 py-1 text-xs font-medium text-gray-700">{f}</li>{/each}
					</ul>

					{#if detail.aturanKost?.length}
						<h4 class="mt-4 text-sm font-bold">Aturan Kos</h4>
						<ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
							{#each detail.aturanKost as a (a)}<li>{a}</li>{/each}
						</ul>
					{/if}
					{#if detailMemuat}<p class="mt-3 text-xs text-gray-400">Memuat detail…</p>{/if}

					<div class="mt-5 flex gap-3">
						<a href={detail.kontakPengelola?.whatsapp ?? kos.whatsapp} target="_blank" rel="noopener" class="flex-1 rounded-full bg-accent py-3 text-center text-sm font-bold text-white transition hover:bg-accent-dark">Hubungi via WhatsApp</a>
						<a href={`tel:${detail.kontakPengelola?.telepon ?? kos.telepon}`} class="rounded-full border border-brand px-5 py-3 text-sm font-semibold text-brand">Telepon</a>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- ===== Modal masuk / daftar ===== -->
	{#if authMode}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true" aria-label={authMode === 'login' ? 'Masuk' : 'Daftar'}>
			<button class="absolute inset-0 cursor-default" aria-label="Tutup" onclick={() => (authMode = null)}></button>
			<form onsubmit={kirimAuth} class="relative w-full max-w-sm space-y-3 rounded-3xl bg-white p-6 shadow-2xl">
				<div class="mb-1">{@render logo()}</div>
				<h3 class="text-lg font-bold text-gray-900">{authMode === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}</h3>
				{#if authMode === 'register'}
					<input bind:value={form.nama} required placeholder="Nama lengkap" class={inputCls} />
					<input bind:value={form.noHp} placeholder="No. HP (opsional)" inputmode="tel" class={inputCls} />
					<select bind:value={form.role} aria-label="Peran" class={inputCls}>
						<option value="penghuni">Saya penghuni / pencari kos</option>
						<option value="pengelola">Saya pemilik / pengelola kos</option>
					</select>
				{/if}
				<input bind:value={form.email} required type="email" placeholder="Email" class={inputCls} />
				<input bind:value={form.password} required type="password" placeholder="Password" class={inputCls} />
				{#if authGalat}<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{authGalat}</p>{/if}
				<button disabled={authMemuat} class="w-full rounded-full bg-accent py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-60">
					{authMemuat ? 'Memproses…' : authMode === 'login' ? 'Masuk' : 'Daftar'}
				</button>
				<p class="text-center text-sm text-gray-500">
					{#if authMode === 'login'}
						Belum punya akun? <button type="button" class="font-semibold text-brand" onclick={() => bukaAuth('register')}>Daftar</button>
					{:else}
						Sudah punya akun? <button type="button" class="font-semibold text-brand" onclick={() => bukaAuth('login')}>Masuk</button>
					{/if}
				</p>
				<button type="button" onclick={() => (authMode = null)} class="absolute top-4 right-5 text-2xl text-gray-400 hover:text-gray-600" aria-label="Tutup">×</button>
			</form>
		</div>
	{/if}
{/if}

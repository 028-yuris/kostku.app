import { PUBLIC_API_URL } from '$app/env/public';

export const API_URL = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE = `${API_URL}/api/v1`;

/** Sesuai respons backend: GET /kamar dan GET /kamar/:id */
export type Kamar = {
	id: number;
	kode: string;
	nomor?: string;
	lantai: number;
	luas: string;
	tipe: string;
	harga: number;
	fasilitas: string[];
	status: string;
	deskripsi: string;
	foto: string[];
	aturanKost?: string[];
	kontakPengelola?: { nama: string; telepon: string; whatsapp: string; alamat: string };
};

/** Sesuai respons backend: GET /kos */
export type Kos = {
	nama: string;
	alamat: string;
	kontakWhatsApp: string;
	whatsapp: string;
	telepon: string;
	namaPengelola: string;
	jamKunjung: string;
	aturan: string[];
	rekening?: { bank: string; nomorRekening: string; atasNama: string };
	tanggalJatuhTempo?: number;
	deskripsi: string;
};

export type User = { id: number; role: string; nama: string; email: string; noHp?: string };

export type Dasbor = {
	kamar: { total: number; terisi: number; kosong: number; rasio: string };
	keuangan: { totalPemasukan: number; jumlahPenunggak: number; pembayaranMenungguVerifikasi: number };
	tiket: { total: number; pending: number; diproses: number; selesai: number };
	ringkasan: {
		kamarTerisi: string;
		pemasukanBulanIni: number;
		penunggak: number;
		menungguVerifikasi: number;
		tiketStatus: string;
	};
};

export type PenghuniItem = {
	id: number;
	nama: string;
	email: string;
	noHp?: string;
	role: string;
	kamar: { id: number; kode: string; lantai: number; tipe: string; harga: number; status: string } | null;
	sewa: { id: number; kamarId: number; tanggalMulai: string; tanggalSelesai: string | null; status: string } | null;
};

export type SewaItem = {
	id: number;
	userId: number;
	kamarId: number;
	nama?: string;
	noHp?: string;
	hargaDisepakati: number;
	deposit?: number;
	tanggalMulai: string;
	tanggalSelesai: string | null;
	status: string;
	user?: { id: number; nama: string; email: string; noHp?: string; role: string } | null;
	kamar?: { id: number; kode: string; lantai: number; tipe: string; harga: number; status: string } | null;
};

export type TagihanItem = {
	id: number;
	sewaId?: number;
	userId: number;
	kamarId: number;
	periode: string;
	bulan?: string;
	nominal: number;
	jatuhTempo: string;
	status: string;
	catatan?: string;
	terlambat?: boolean;
	hariTerlambat?: number;
	user?: { id: number; nama: string; email: string; noHp?: string } | null;
	kamar?: { id: number; kode: string; lantai: number; tipe: string; harga: number } | null;
	pembayaran?: PembayaranItem[];
};

export type TagihanSayaItem = Omit<TagihanItem, 'pembayaran'> & {
	pembayaran?: PembayaranItem | null;
};

export type PembayaranSayaItem = {
	id: number;
	tagihanId: number;
	nominal: number;
	metode: string;
	buktiFoto: string;
	tanggalBayar: string;
	status: string;
	catatan?: string;
	periode?: string | null;
	bulan?: string | null;
	kamar?: string | number | null;
	tagihan?: {
		id: number;
		periode: string;
		bulan?: string;
		nominal: number;
		jatuhTempo: string;
		status: string;
	} | null;
};

export type PenunggakItem = {
	id: number;
	tagihanId: number;
	userId: number;
	namaPenghuni: string | null;
	kamar: string | null;
	nominal: number;
	periode: string;
	jatuhTempo: string;
	hariTerlambat: number;
	status: string;
	penghuni?: { id: number; nama: string; email: string; noHp?: string } | null;
};

export type PembayaranItem = {
	id: number;
	tagihanId: number;
	userId: number;
	nominal: number;
	metode: string;
	buktiFoto: string;
	tanggalBayar: string;
	status: string;
	catatan?: string;
	namaPenghuni?: string | null;
	kamar?: string | number | null;
	periode?: string | null;
	detailTagihan?: { id: number; periode: string; nominal: number; jatuhTempo: string; status: string } | null;
};

export type TiketRiwayat = { status: string; catatan: string; tanggal: string };

export type TiketItem = {
	id: number;
	userId: number;
	kamarId: number | null;
	kategori: string;
	judul: string;
	deskripsi: string;
	foto: string | null;
	status: string;
	penanganan: string | null;
	riwayat: TiketRiwayat[];
	tanggalLapor: string;
	pelapor?: string | null;
	kamar?: string | number;
	user?: { id: number; nama: string; email: string; noHp?: string } | null;
};

export type NotifikasiItem = {
	id: number;
	userId: number;
	tipe: string;
	judul: string;
	isi: string;
	dibaca: boolean;
	createdAt: string;
};

type Fetch = typeof fetch;

function getToken(): string | null {
	if (typeof localStorage === 'undefined') return null;
	return localStorage.getItem('kostku_token');
}

async function request<T>(f: Fetch, path: string, init?: RequestInit, useAuth = false): Promise<T> {
	const headers = new Headers(init?.headers || {});
	if (!(init?.body instanceof FormData) && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}
	if (useAuth) {
		const token = getToken();
		if (token) headers.set('Authorization', `Bearer ${token}`);
	}
	const res = await f(`${BASE}${path}`, { ...init, headers });
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.status === false || json.success === false) {
		throw new Error(json.message || `Permintaan gagal (${res.status})`);
	}
	return json.data as T;
}

const qs = (params: Record<string, string | undefined>) => {
	const s = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) if (v) s.set(k, v);
	const q = s.toString();
	return q ? `?${q}` : '';
};

// ===== Publik & Auth =====
export const getKos = (f: Fetch = fetch) => request<Kos>(f, '/kos');
export const getKamarTersedia = (f: Fetch = fetch) => request<Kamar[]>(f, '/kamar?status=kosong');
export const getKamar = (id: number, f: Fetch = fetch) => request<Kamar>(f, `/kamar/${id}`);

export const login = (email: string, password: string) =>
	request<{ user: User; token: string }>(fetch, '/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password })
	});

export const register = (body: { nama: string; email: string; password: string; noHp?: string; role?: string }) =>
	request<User>(fetch, '/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const getMe = () => request<User>(fetch, '/auth/me', undefined, true);

// ===== Dasbor Pengelola =====
export const getDasbor = () => request<Dasbor>(fetch, '/dasbor', undefined, true);

// ===== Kelola Kamar (Pengelola) =====
export const getSemuaKamar = (status?: string) =>
	request<Kamar[]>(fetch, `/kamar${qs({ status })}`, undefined, true);

export const createKamar = (body: Record<string, unknown> | FormData) =>
	request<Kamar>(
		fetch,
		'/kamar',
		{ method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) },
		true
	);

export const updateKamar = (id: number, body: Record<string, unknown>) =>
	request<Kamar>(fetch, `/kamar/${id}`, { method: 'PUT', body: JSON.stringify(body) }, true);

export const uploadFotoKamar = (id: number, file: File) => {
	const fd = new FormData();
	fd.append('foto', file);
	return request<{ id: number; kode: string; foto: string[]; uploaded: string }>(
		fetch,
		`/kamar/${id}/foto`,
		{ method: 'POST', body: fd },
		true
	);
};

export const deleteKamar = (id: number) =>
	request<Kamar>(fetch, `/kamar/${id}`, { method: 'DELETE' }, true);

// ===== Penghuni & Sewa (Pengelola) =====
export const getPenghuni = (tanpaSewa?: boolean) =>
	request<PenghuniItem[]>(fetch, `/penghuni${tanpaSewa ? '?tanpaSewa=true' : ''}`, undefined, true);

export const getSewa = (status?: string) =>
	request<SewaItem[]>(fetch, `/sewa${qs({ status })}`, undefined, true);

export const createSewa = (body: {
	userId: number;
	kamarId: number;
	tanggalMasuk?: string;
	hargaDisepakati?: number;
	deposit?: number;
	tanggalSelesai?: string;
}) => request<{ sewa: SewaItem }>(fetch, '/sewa', { method: 'POST', body: JSON.stringify(body) }, true);

export const akhiriSewa = (id: number, tanggalSelesai?: string) =>
	request<{ sewa: SewaItem }>(
		fetch,
		`/sewa/${id}/akhiri`,
		{ method: 'PATCH', body: JSON.stringify(tanggalSelesai ? { tanggalSelesai } : {}) },
		true
	);

// ===== Tagihan & Penunggak (Pengelola) =====
export const getTagihan = (periode?: string, status?: string) =>
	request<TagihanItem[]>(fetch, `/tagihan${qs({ periode, status })}`, undefined, true);

export const getTagihanDetail = (id: number) =>
	request<TagihanItem>(fetch, `/tagihan/${id}`, undefined, true);

export const generateTagihan = (periode: string) =>
	request<{ periode: string; totalDibuat: number; totalDilewati: number }>(
		fetch,
		'/tagihan/generate',
		{ method: 'POST', body: JSON.stringify({ periode }) },
		true
	);

export const getPenunggak = () => request<PenunggakItem[]>(fetch, '/tagihan/penunggak', undefined, true);

// ===== Pembayaran (Pengelola) =====
export const getPembayaran = (status?: string) =>
	request<PembayaranItem[]>(fetch, `/pembayaran${qs({ status })}`, undefined, true);

export const verifikasiPembayaran = (id: number, keputusan: 'diterima' | 'ditolak', catatan?: string) =>
	request<{ pembayaran: PembayaranItem; tagihan: TagihanItem | null }>(
		fetch,
		`/pembayaran/${id}/verifikasi`,
		{ method: 'PATCH', body: JSON.stringify({ keputusan, catatan }) },
		true
	);

// ===== Tiket Kerusakan (Pengelola) =====
export const getTiket = (status?: string, kategori?: string) =>
	request<TiketItem[]>(fetch, `/tiket${qs({ status, kategori })}`, undefined, true);

export const getTiketDetail = (id: number) => request<TiketItem>(fetch, `/tiket/${id}`, undefined, true);

export const updateStatusTiket = (id: number, status: 'diproses' | 'selesai', catatan?: string) =>
	request<TiketItem>(
		fetch,
		`/tiket/${id}/status`,
		{ method: 'PATCH', body: JSON.stringify({ status, catatan }) },
		true
	);

// ===== Info Kos (Pengelola) =====
export const updateKos = (body: Record<string, unknown>) =>
	request<Kos>(fetch, '/kos', { method: 'PUT', body: JSON.stringify(body) }, true);

// ===== Fitur Penghuni =====
export const getTagihanSaya = () => request<TagihanSayaItem[]>(fetch, '/tagihan/saya', undefined, true);

export const uploadBuktiPembayaran = (
	tagihanId: number,
	file: File,
	opts?: { jumlah?: number; metode?: string; catatan?: string }
) => {
	const fd = new FormData();
	fd.append('bukti', file);
	if (opts?.jumlah !== undefined) fd.append('jumlah', String(opts.jumlah));
	if (opts?.metode) fd.append('metode', opts.metode);
	if (opts?.catatan) fd.append('catatan', opts.catatan);
	return request<{ tagihan: TagihanItem; pembayaran: PembayaranItem }>(
		fetch,
		`/tagihan/${tagihanId}/pembayaran`,
		{ method: 'POST', body: fd },
		true
	);
};

export const getPembayaranSaya = () =>
	request<PembayaranSayaItem[]>(fetch, '/pembayaran/saya', undefined, true);

export const getTiketSaya = (status?: string) =>
	request<TiketItem[]>(fetch, `/tiket/saya${qs({ status })}`, undefined, true);

export const createTiket = (body: {
	kategori: string;
	judul: string;
	deskripsi: string;
	kamarId?: number | null;
	foto?: File | null;
}) => {
	const fd = new FormData();
	fd.append('kategori', body.kategori);
	fd.append('judul', body.judul);
	fd.append('deskripsi', body.deskripsi);
	if (body.kamarId) fd.append('kamarId', String(body.kamarId));
	if (body.foto) fd.append('foto', body.foto);
	return request<TiketItem>(fetch, '/tiket', { method: 'POST', body: fd }, true);
};

// ===== Notifikasi (Login) =====
export const getNotifikasi = () => request<NotifikasiItem[]>(fetch, '/notifikasi/saya', undefined, true);
export const getNotifikasiBelumDibaca = () =>
	request<{ belumDibaca: number }>(fetch, '/notifikasi/belum-dibaca', undefined, true);
export const bacaNotifikasi = (id: number) =>
	request<NotifikasiItem>(fetch, `/notifikasi/${id}/baca`, { method: 'PATCH' }, true);
export const bacaSemuaNotifikasi = () =>
	request<{ jumlahDitandai: number }>(fetch, '/notifikasi/baca-semua', { method: 'PATCH' }, true);

/** Path relatif dari backend (mis. uploads/foto.png) diubah jadi URL penuh. */
export function aset(path?: string | null): string {
	if (!path) return '';
	if (/^https?:\/\//i.test(path)) return path;
	return `${API_URL}/${path.replace(/^\//, '')}`;
}

export const rupiah = (n: number) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export const formatTanggal = (iso?: string | null) => {
	if (!iso) return '-';
	const d = new Date(iso);
	if (isNaN(d.getTime())) return iso;
	return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

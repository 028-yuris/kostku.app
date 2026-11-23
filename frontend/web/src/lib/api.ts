import { PUBLIC_API_URL } from '$app/env/public';

export const API_URL = (PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const BASE = `${API_URL}/api/v1`;

/** Sesuai respons backend: GET /kamar dan GET /kamar/:id */
export type Kamar = {
	id: number;
	kode: string;
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
	deskripsi: string;
};

export type User = { id: number; role: string; nama: string; email: string; noHp?: string };

type Fetch = typeof fetch;

async function request<T>(f: Fetch, path: string, init?: RequestInit): Promise<T> {
	const res = await f(`${BASE}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
	});
	const json = await res.json().catch(() => ({}));
	if (!res.ok || json.status === false || json.success === false) {
		throw new Error(json.message || `Permintaan gagal (${res.status})`);
	}
	return json.data as T;
}

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

/** Path relatif dari backend (mis. uploads/foto.png) diubah jadi URL penuh. */
export function aset(path?: string | null): string {
	if (!path) return '';
	if (/^https?:\/\//i.test(path)) return path;
	return `${API_URL}/${path.replace(/^\//, '')}`;
}

export const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

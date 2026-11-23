import { getKamarTersedia, getKos } from '../lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	try {
		const [kos, kamar] = await Promise.all([getKos(fetch), getKamarTersedia(fetch)]);
		return { kos, kamar, error: null as string | null };
	} catch (e) {
		return {
			kos: null,
			kamar: [],
			error: e instanceof Error ? e.message : 'Gagal terhubung ke server'
		};
	}
};

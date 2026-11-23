import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DATABASE_URL: { description: 'The database connection string.' },
	PUBLIC_API_URL: {
		public: true,
		description: 'Base URL backend API Kostku (sumber seluruh konten landing page).',
		schema: (v) => v || 'http://localhost:3000'
	}
});

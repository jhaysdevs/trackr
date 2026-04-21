import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	sassOptions: {
		includePaths: ['./src/styles'],
		silenceDeprecations: ['legacy-js-api'],
	},
};

export default nextConfig;

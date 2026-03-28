import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: NextConfig = {
  outputFileTracingRoot: resolve(__dirname, '../../'),
  transpilePackages: ['@pet-central/ui', '@pet-central/types'],
};

export default config;

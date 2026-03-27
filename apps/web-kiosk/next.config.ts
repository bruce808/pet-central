import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: [
    '@pet-central/ui',
    '@pet-central/types',
    '@pet-central/partner-routing',
  ],
};

export default config;

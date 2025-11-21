import type { NextConfig } from 'next';
import { proxyConfig } from './proxy';

const nextConfig: NextConfig = {
  ...proxyConfig,
};

export default nextConfig;

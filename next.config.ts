import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // MDX support for blog + changelog comes later (M4.9-M4.11).
};

export default withNextIntl(nextConfig);

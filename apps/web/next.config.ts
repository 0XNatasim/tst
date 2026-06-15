import type { NextConfig } from "next"

const config: NextConfig = {
  transpilePackages: ["@openquebec/db", "@openquebec/shared", "@openquebec/crawlers"],
  serverExternalPackages: ["postgres"],
}

export default config

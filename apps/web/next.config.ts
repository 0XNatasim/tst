import type { NextConfig } from "next"

const config: NextConfig = {
  transpilePackages: ["@openquebec/db", "@openquebec/shared"],
}

export default config

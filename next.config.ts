import type {NextConfig} from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const withMDX = createMDX({});

function r2RemoteImagePattern():
    | { protocol: "https" | "http"; hostname: string; pathname: string }
    | null {
    const raw = process.env.R2_PUBLIC_URL?.trim();
    if (!raw) {
        return null;
    }
    const href =
        raw.startsWith("http://") || raw.startsWith("https://")
            ? raw
            : `https://${raw}`;
    try {
        const url = new URL(href);
        return {
            protocol: url.protocol === "http:" ? "http" : "https",
            hostname: url.hostname,
            pathname: "/**",
        };
    } catch {
        return null;
    }
}

const r2Pattern = r2RemoteImagePattern();

const nextConfig: NextConfig = {
    // jsdom 28+ pulls html-encoding-sniffer@6 → @exodus/bytes (ESM-only), which breaks
    // require() on some serverless Node builds; isomorphic-dompurify only needs a DOM impl.
    serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
    pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
    images: {
        remotePatterns: r2Pattern ? [r2Pattern] : [],
        qualities: [25, 75, 80, 85, 95],
    },
};

export default withNextIntl(withMDX(nextConfig));

import type { MetadataRoute } from "next";

const SITE_URL = "https://fielriopardo.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/master/",
          "/api/",
          "/bolao/entrar",
          "/bolao/perfil",
          "/bolao/redefinir-senha",
        ],
      },
    ],
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}

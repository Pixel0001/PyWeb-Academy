export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/teacher/", "/api/", "/login"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pyweb.online'}/sitemap.xml`,
  }
}

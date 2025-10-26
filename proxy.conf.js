const PROXY_CONFIG = [
  {
    context: [
      "/smartClub/rest/**",
      "/smartClub/app/**"
    ],
    target: "http://dev.smart-club.co.il:80",
    secure: false,
    changeOrigin: true,
    logLevel: "info"
  },
  {
    context: ["/TheLaundryPass/rest/**"],
    target: "https://192.168.10.46:80",
    secure: false,
    changeOrigin: true,
    logLevel: "info"
  },
  {
    context: ["/push-server/**"],
    target: "ws://dev.smart-club.co.il:80",
    ws: true,
    secure: false,
    changeOrigin: true,
    logLevel: "info"
  }
];

module.exports = PROXY_CONFIG;

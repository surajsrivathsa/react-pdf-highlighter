import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
// import react from '@vitejs/plugin-react';
// import viteTsconfigPaths from 'vite-tsconfig-paths';
// import svgrPlugin from 'vite-plugin-svgr';

export default defineConfig({
  base: "/react-pdf-highlighter/",
  build: {
    outDir: "dist",
  },
  plugins: [ reactRefresh() ],
  server: {
    port: 3000,
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
  },
});

// reactRefresh(),
// react({
//     jsxRuntime: 'classic' // Add this line
//   }), viteTsconfigPaths(), svgrPlugin()

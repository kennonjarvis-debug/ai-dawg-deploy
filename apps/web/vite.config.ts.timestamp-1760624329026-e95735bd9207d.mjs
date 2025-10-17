// vite.config.ts
import { defineConfig } from "file:///Users/benkennon/dawg-ai/node_modules/.pnpm/vite@5.4.20_@types+node@20.19.21/node_modules/vite/dist/node/index.js";
import { svelte } from "file:///Users/benkennon/dawg-ai/node_modules/.pnpm/@sveltejs+vite-plugin-svelte@3.1.2_svelte@5.39.12_vite@5.4.20/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import path from "path";
var __vite_injected_original_dirname = "/Users/benkennon/dawg-ai/apps/web";
var vite_config_default = defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@dawg-ai/design-system": path.resolve(__vite_injected_original_dirname, "../../packages/design-system/src"),
      "@dawg-ai/audio-engine": path.resolve(__vite_injected_original_dirname, "../../packages/audio-engine/src"),
      "@dawg-ai/track-manager": path.resolve(__vite_injected_original_dirname, "../../packages/track-manager/src"),
      "@dawg-ai/types": path.resolve(__vite_injected_original_dirname, "../../packages/types/src")
    }
  },
  server: {
    port: 5173,
    strictPort: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYmVua2Vubm9uL2Rhd2ctYWkvYXBwcy93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9iZW5rZW5ub24vZGF3Zy1haS9hcHBzL3dlYi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYmVua2Vubm9uL2Rhd2ctYWkvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IHN2ZWx0ZSB9IGZyb20gJ0BzdmVsdGVqcy92aXRlLXBsdWdpbi1zdmVsdGUnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtzdmVsdGUoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0BkYXdnLWFpL2Rlc2lnbi1zeXN0ZW0nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvZGVzaWduLXN5c3RlbS9zcmMnKSxcbiAgICAgICdAZGF3Zy1haS9hdWRpby1lbmdpbmUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvYXVkaW8tZW5naW5lL3NyYycpLFxuICAgICAgJ0BkYXdnLWFpL3RyYWNrLW1hbmFnZXInOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvdHJhY2stbWFuYWdlci9zcmMnKSxcbiAgICAgICdAZGF3Zy1haS90eXBlcyc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy90eXBlcy9zcmMnKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIHN0cmljdFBvcnQ6IGZhbHNlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFSLFNBQVMsb0JBQW9CO0FBQ2xULFNBQVMsY0FBYztBQUN2QixPQUFPLFVBQVU7QUFGakIsSUFBTSxtQ0FBbUM7QUFJekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUFBLEVBQ2xCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLDBCQUEwQixLQUFLLFFBQVEsa0NBQVcsa0NBQWtDO0FBQUEsTUFDcEYseUJBQXlCLEtBQUssUUFBUSxrQ0FBVyxpQ0FBaUM7QUFBQSxNQUNsRiwwQkFBMEIsS0FBSyxRQUFRLGtDQUFXLGtDQUFrQztBQUFBLE1BQ3BGLGtCQUFrQixLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsSUFDdEU7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsRUFDZDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

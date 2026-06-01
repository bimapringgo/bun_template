import { webRoutes } from "./routes/web";
import path from "path";

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    // 1. Try to serve a static file first
    // This checks if the requested URL exists inside the "public" folder
    if (url.pathname !== "/") {
      const publicPath = path.join(process.cwd(), "public", url.pathname);
      const file = Bun.file(publicPath);
      
      // If the file exists on the hard drive, send it to the browser!
      if (await file.exists()) {
        return new Response(file);
      }
    }

    // 2. If it's not a static file, check our standard routes
    const routeKey = `${req.method} ${url.pathname}`;
    const handler = webRoutes[routeKey];

    if (handler) {
      return handler(req, url);
    }

    // 3. Default 404 Fallback
    return new Response("404 - Page not found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
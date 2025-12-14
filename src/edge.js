import { icons } from './generated/icons-edge.js';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // API Route: /api/match?q=keyword
  if (url.pathname === '/api/match') {
    const keyword = url.searchParams.get('q');
    
    if (!keyword) {
       return new Response(JSON.stringify({ 
         error: "Missing 'q' parameter",
         usage: "/api/match?q=keyword"
       }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    const lowerKeyword = keyword.toLowerCase();
    const matches = icons.filter(icon => icon.toLowerCase().includes(lowerKeyword));
    
    // Construct full URLs
    // Note: In ESA, request.url gives the full URL
    const results = matches.map(icon => ({
      name: icon,
      url: new URL(`/icon/${icon}`, url.origin).toString(),
      download_url: new URL(`/api/download?name=${encodeURIComponent(icon)}`, url.origin).toString()
    }));

    return new Response(JSON.stringify({
      count: results.length,
      results: results
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });
  }

  // API Route: /api/download?name=filename
  if (url.pathname === '/api/download') {
    const name = url.searchParams.get('name');
    if (!name) {
      return new Response("Missing name", { status: 400 });
    }
    
    // Check if file exists in our list (security check)
    if (!icons.includes(name)) {
      return new Response("File not found", { status: 404 });
    }

    // Redirect to the actual static file, but with Content-Disposition header?
    // ESA static assets are served from the same domain.
    // If we redirect, the browser will just open it.
    // To force download, we might need to fetch and stream it, or rely on HTML5 download attribute on frontend.
    // Since this is an Edge Routine, streaming might consume resources.
    // Let's try to fetch the internal asset and return it with headers.
    
    try {
      // Fetch the static asset from "self" (which ESA handles)
      const assetUrl = new URL(`/icon/${name}`, url.origin);
      const assetResponse = await fetch(assetUrl);
      
      if (!assetResponse.ok) {
        return new Response("Asset fetch failed", { status: assetResponse.status });
      }

      const newHeaders = new Headers(assetResponse.headers);
      newHeaders.set('Content-Disposition', `attachment; filename="${name}"`);
      
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        headers: newHeaders
      });
    } catch (e) {
      return new Response("Internal Error", { status: 500 });
    }
  }

  // Fallback to static assets (ESA handles this automatically if we don't return a response?)
  // According to docs: "If the script does not return a response, the request is passed to the next handler (e.g. static assets)."
  // BUT `event.respondWith` expects a promise that resolves to a Response.
  // If we want to fallback, we usually fetch(request).
  
  return fetch(request);
}

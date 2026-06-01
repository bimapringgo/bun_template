// Helper function to parse cookies from the request header
export function getCookie(req: Request, name: string): string | null {
  const cookieString = req.headers.get("Cookie");
  if (!cookieString) return null;

  const match = cookieString.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
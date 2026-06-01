import ejs from "ejs";
import path from "path";
import jwt from "jsonwebtoken"; // NEW
import { getCookie } from "../app/libs/sessionChecker";
import { handleLoginSubmit } from "../app/models/Login/Login"; 

// import User from "../app/models/User/User"; // Import your modernized User model
// import Dashboard from "../app/models/Dashboard/Dashboard"; // Import your modernized User model

// routes/web.ts
import * as Models from "../app/models"; // This automatically reads index.ts

export const routes = {
    "POST /user-data": async (req: Request) => {
        const body = await req.json();
        
        // VS Code will now PERFECTLY auto-complete this!
        return await Models.User.data(body); 
    }
};

// Define what our JWT contains so TypeScript can help us out
interface AuthPayload {
  user: string;
  userId: number;
  roleId: number;
  roleName: string;
}

export async function render(viewRelativePath: string, data: any = {}) {
  const viewPath = path.join(process.cwd(), "views", ...viewRelativePath.split('/'));
  const html = await ejs.renderFile(viewPath, data) as string;
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}

// --- Helper 2: Protected Route Wrapper ---
// The handler now accepts our AuthPayload object
function protectedRoute(handler: (req: Request, payload: AuthPayload) => Promise<Response> | Response) {
  return async (req: Request, url: URL) => {
    
    // Look for our new JWT cookie
    const token = getCookie(req, "auth_token");
    
    if (!token) {
      return new Response(null, { status: 302, headers: { Location: "/" } });
    }
    
    try {
      // 1. Verify the Token using our secret key from .env
      const secretKey = process.env.JWT_SECRET || "fallback_secret";
      const decoded = jwt.verify(token, secretKey) as AuthPayload;
      
      // 2. Execute the route handler, passing the decoded payload
      return await handler(req, decoded);

    } catch (error) {
      // If the token is modified by the user, or if it expires, jwt.verify() throws an error!
      console.error("JWT Verification failed:", error);
      
      // Clear the invalid cookie and kick them back to login
      return new Response(null, {
        status: 302,
        headers: { 
          "Location": "/",
          "Set-Cookie": "auth_token=; HttpOnly; Path=/; Max-Age=0" 
        }
      });
    }
  };
}

export const webRoutes: Record<string, (req: Request, url: URL) => Promise<Response> | Response> = {
  
  "GET /": async () => render("login/login.ejs", { error: null }),

  // Notice how much cleaner this is! We just pull what we need from `payload`
  "GET /dashboard": protectedRoute(async (req, payload) => {
    return render("dashboard/dashboard.ejs", { 
      user: payload.user,
      user_id: payload.userId,
      role_id: payload.roleId,
      user_role: payload.roleName,
      page: "Dashboard"
    });
  }),

  "GET /projects": protectedRoute(async (req, payload) => {
    return render("projects/projects.ejs", { 
      user: payload.user,
      user_id: payload.userId,
      role_id: payload.roleId,
      user_role: payload.roleName,
      page: "Projects"
    });
  }),
  "POST /dashboard-data": async (req: Request) => {
      try {
          // 2. Parse the JSON sent by our new fetch() function
          const body = await req.json();

          // 3. Pass the parsed data to your Model's logic
          return await Models.Dashboard.data(body);
          
      } catch (err) {
          // Fallback if the JSON is malformed
          return Response.json({ status: "error", message: "Invalid JSON payload" }, { status: 400 });
      }
  },

  "GET /sidebar": protectedRoute(async (req, payload) => {
    return render("dashboard/dashboard_sidebar.ejs", { 
      user: payload.user, 
      user_role: payload.roleName,
      page: "Side Bar" 
    });
  }),

  "POST /user-data": async (req: Request) => {
      try {
          // 2. Parse the JSON sent by our new fetch() function
          const body = await req.json();

          // 3. Pass the parsed data to your Model's logic
          return await Models.User.data(body);
          
      } catch (err) {
          // Fallback if the JSON is malformed
          return Response.json({ status: "error", message: "Invalid JSON payload" }, { status: 400 });
      }
  },

  // Update logout to destroy the new 'auth_token' cookie
  "GET /logout": async () => {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": "auth_token=; HttpOnly; Path=/; Max-Age=0"
      },
    });
  },

  "POST /login": handleLoginSubmit
};
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../../libs/dbConn"; 
import { render } from "../../../routes/web"; 

export async function handleLoginSubmit(req: Request): Promise<Response> {
    try {
        // 1. Extract the credentials from the EJS login form submission
        const formData = await req.formData();
        const username = formData.get("user") as string;
        const formPassword = formData.get("password") as string;

        if (!username || !formPassword) {
            return render("login/login", { error: "Username and password are required." });
        }

        // 2. Query the database by username ONLY.
        // CRITICAL: We must include 'a.password' in the SELECT statement so bcrypt can read the hash!
        const [rows]: any = await pool.query(
            `SELECT a.id AS user_id, a.user_nm, a.password, b.nm_role AS user_role_name 
             FROM user a 
             LEFT JOIN role b ON a.role = b.id 
             WHERE a.user_nm = ? LIMIT 1`,
            [username]
        );

        // 3. If no rows return, the username doesn't exist
        if (rows.length === 0) {
            return render("login/login.ejs", { error: "Invalid username or password." });
        }

        const databaseUser = rows[0];

        // 4. Use bcrypt to securely check if the typed password matches the database hash
        const isMatch = await bcrypt.compare(formPassword, databaseUser.password);

        if (!isMatch) {
            // Password mismatch—return a generic error to keep hackers guessing
            return render("login/login.ejs", { error: "Invalid username or password." });
        }

        // 5. Authentication successful! Pack user data into a tamper-proof JWT
        const secretKey = process.env.JWT_SECRET || "super_secret_fallback_key";

        const payload = {
        user: databaseUser.user_nm,
        userId: databaseUser.user_id,
        roleId: databaseUser.user_role_id,
        roleName: databaseUser.user_role_name
      };
        // const payload = {
        //     id: databaseUser.id,
        //     user: databaseUser.user,
        //     role: databaseUser.user_role_name
        // };

        const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

        // 6. Drop the secure JWT token into an HttpOnly cookie and redirect to the dashboard
        return new Response(null, {
            status: 302,
            headers: {
                "Location": "/dashboard",
                "Set-Cookie": `auth_token=${token}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
            }
        });

    } catch (error) {
        console.error("Database or authentication error:", error);
        return render("login/login.ejs", { error: "An unexpected error occurred. Please try again later." });
    }
}
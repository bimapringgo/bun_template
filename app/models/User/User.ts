// app/models/User/User.ts
import { pool } from "../../libs/dbConn"; // Assuming you are using mysql2 pool

const User = {
    data: async (d: any) => {
        try {
            // Your exact same action-based switch statement!
            switch (d.a) {

                case 'tbl_user': {
                    const q = `SELECT * FROM user`;
                    const [rows] = await pool.query(q);
                    
                    // Return Bun's native JSON Response
                    return Response.json({ status: 'ok', message: 'Sukses.', data: rows });
                }

                case 'save_user': {
                    // Note: Use Bun.password.hashSync() instead of bcryptjs! It's built-in and much faster.
                    const pass = Bun.password.hashSync(d.pass); 

                    const qd = [d.nama, d.email, d.phone, d.role, pass];
                    const q = `INSERT INTO user (user, email, phone_number, role, password) VALUES (?, ?, ?, ?, ?)`;
                    
                    const [result] = await pool.query(q, qd);

                    return Response.json({ status: 'ok', message: 'User saved successfully.', data: result });
                }

                // ... other cases ...

                default: {
                    return Response.json({ status: 'error', message: 'Unknown method.' }, { status: 400 });
                }
            }
        } catch (err: any) {
            // Native 500 Server Error Response
            return Response.json({ status: 'error', message: err.message }, { status: 500 });
        }
    }
}

export default User;
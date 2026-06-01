// app/models/Editor/Editor.ts
import { join } from "path";

// Define where you want to safely store the user-uploaded files
const UPLOADS_DIR = join(process.cwd(), "storage/uploads");

export async function handleEditorAction(body: any): Promise<Response> {
    const action = body.a; // Extract the action key

    switch (action) {
        case 'save_file':
            return await saveFile(body.filename, body.content);
        
        default:
            return Response.json({ success: false, message: "Unknown action" }, { status: 400 });
    }
}

async function saveFile(filename: string, content: string): Promise<Response> {
    try {
        // Sanitize the filename slightly to prevent Directory Traversal attacks (e.g., ../../etc/passwd)
        const safeFilename = filename.replace(/^.*[\\\/]/, ''); 
        const filePath = join(UPLOADS_DIR, safeFilename);

        // Bun.write automatically creates the file or overwrites it if it exists
        await Bun.write(filePath, content);

        return Response.json({ 
            success: true, 
            message: `File '${safeFilename}' has been successfully saved to the server.` 
        });
    } catch (error: any) {
        return Response.json({ 
            success: false, 
            message: `Failed to save file: ${error.message}` 
        }, { status: 500 });
    }
}
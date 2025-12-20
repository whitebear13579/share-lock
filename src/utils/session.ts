import { User } from "firebase/auth";

/*

    Creates a server-side session for the authenticated user.
    This ensures the middleware can verify authentication on subsequent requests.

    @param user - The Firebase authenticated user
    @returns Promise<boolean> - True if session was created successfully

*/
export const createSession = async (user: User): Promise<boolean> => {
    try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            console.error("Failed to create session:", await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error creating session:", error);
        return false;
    }
};

/*

    Deletes the server-side session.
    Should be called during logout.

    @returns Promise<boolean> - True if session was deleted successfully

*/
export const deleteSession = async (): Promise<boolean> => {
    try {
        const response = await fetch("/api/auth/session", {
            method: "DELETE",
        });
        return response.ok;
    } catch (error) {
        console.error("Error deleting session:", error);
        return false;
    }
};

/*

    Verifies if the current session is valid.

    @returns Promise<boolean> - True if session is valid

*/
export const verifySession = async (): Promise<boolean> => {
    try {
        const response = await fetch("/api/auth/session", {
            method: "GET",
        });
        return response.ok;
    } catch (error) {
        console.error("Error verifying session:", error);
        return false;
    }
};

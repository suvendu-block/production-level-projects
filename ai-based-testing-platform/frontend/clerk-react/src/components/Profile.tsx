import { useAuth } from "@clerk/react";

function Profile() {
    const { getToken } = useAuth();

    const fetchProfile = async () => {
        const token = await getToken();

        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/api/users/profile`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        console.log(data);
    };

    return (
        <button onClick={fetchProfile}>
            Get Profile
        </button>
    );
}

export default Profile;
const uploadFile = async (file) => {
    
    const cloudinaryName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryName}/auto/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append("upload_preset", "chat-app-preset"); // Your preset name

    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("Upload failed");

        const responseData = await response.json();
        return responseData; // Returns object with secure_url, public_id, etc.
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return null;
    }
};

export default uploadFile;
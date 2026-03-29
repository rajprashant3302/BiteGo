const uploadFile = async (file) => {
    const cloudinaryName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; 
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    // Safety check just in case your .env variables aren't loading!
    if (!cloudinaryName || !uploadPreset) {
        console.error("Cloudinary env variables are missing!");
        return null;
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudinaryName}/auto/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append("upload_preset", uploadPreset); 
    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            // This will help us debug if it fails again!
            const errorData = await response.json();
            throw new Error(`Upload failed: ${errorData.error?.message || response.statusText}`);
        }

        const responseData = await response.json();
        return responseData.secure_url; // Returns just the URL string so it slots perfectly into your ChatWindow
    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message);
        return null;
    }
};

export default uploadFile;
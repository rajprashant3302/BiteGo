"use client";

import  { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FiArrowLeft, FiUser, FiMail, FiPhone, 
  FiCamera, FiLoader, FiCheckCircle 
} from "react-icons/fi";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [fetchedProfilePic, setFetchedProfilePic] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [isFetching, setIsFetching] = useState(true);
  const [reqStatus, setReqStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
            ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/profile/${session.user.id}` 
            : `http://localhost:5000/api/auth/profile/${session.user.id}`;
          
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const data = await response.json();
            setFormData({
              name: data.Name || "",
              email: data.Email || "",
              phone: data.Phone || "",
            });
            if (data.ProfilePicURL) {
              setFetchedProfilePic(data.ProfilePicURL);
            }
          } else {
            console.error("Failed to fetch fresh profile data");
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchUserProfile();
  }, [status, session]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setReqStatus({ loading: false, error: "Please select a valid image file.", success: null });
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary configuration is missing in environment variables.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Failed to upload image to Cloudinary");
    
    return data.secure_url;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setReqStatus({ loading: true, error: null, success: null });

    try {
      let finalImageUrl = fetchedProfilePic || session?.user?.image;
      if (selectedFile) {
        finalImageUrl = await uploadToCloudinary(selectedFile);
      }

      const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/update-profile` 
        : "http://localhost:5000/api/auth/update-profile"; 

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          name: formData.name,
          phone: formData.phone,
          profilePic: finalImageUrl, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      await update({
        name: formData.name,
        phone: formData.phone,
        image: finalImageUrl, 
      });

      setReqStatus({ loading: false, error: null, success: "Profile updated successfully!" });

      setTimeout(() => {
        router.push("/settings");
        router.refresh();
      }, 1500);

    } catch (error) {
      setReqStatus({ 
        loading: false, 
        error: error.message || "Something went wrong.", 
        success: null 
      });
    }
  };

  const isPageLoading = status === "loading" || status === "unauthenticated" || isFetching;
  
  const fallbackName = formData.name || session?.user?.name || 'User';
  const displayProfilePic = imagePreview || fetchedProfilePic || session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackName}`;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="px-6 py-5 flex items-center justify-between bg-white relative z-10">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-semibold text-sm"
            >
              <FiArrowLeft className="mr-2" size={18} />
              Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
            <div className="w-16"></div> 
          </div>

          <div className="h-32 bg-gradient-to-r from-[#FFF0E6] to-[#FFDBCB] relative border-t border-gray-50"></div>

          <div className="px-6 pb-8 sm:px-12 relative">
            
            <div className="relative flex justify-center -mt-16 mb-8">
              {isPageLoading ? (
                <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse border-4 border-white shadow-md"></div>
              ) : (
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                    <img 
                      src={displayProfilePic} 
                      alt="Profile" 
                      className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                    />
                  </div>
                  
                  <div className="absolute bottom-1 right-1 bg-[#FF651D] p-2.5 rounded-full text-white shadow-lg border-2 border-white group-hover:bg-[#D84A00] transition-colors">
                    <FiCamera size={18} />
                  </div>
                  
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                {isPageLoading ? (
                  <div className="h-[52px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                    </div>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                {isPageLoading ? (
                  <div className="h-[52px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiPhone className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium"
                      placeholder=""
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                {isPageLoading ? (
                  <div className="h-[52px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" size={20} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      disabled 
                      value={formData.email}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-500 bg-gray-100 cursor-not-allowed outline-none text-base font-medium"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">Email address cannot be changed directly for security reasons.</p>
              </div>

              {reqStatus.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 flex items-center">
                  {reqStatus.error}
                </div>
              )}
              {reqStatus.success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-semibold border border-green-100 flex items-center justify-center">
                  <FiCheckCircle className="mr-2" size={20} />
                  {reqStatus.success}
                </div>
              )}

              {isPageLoading ? (
                <div className="h-14 w-full bg-gray-200 animate-pulse rounded-xl mt-6"></div>
              ) : (
                <button
                  type="submit"
                  disabled={reqStatus.loading}
                  className="w-full bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg mt-6"
                >
                  {reqStatus.loading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" size={22} />
                      {selectedFile ? "Uploading & Saving..." : "Saving Changes..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
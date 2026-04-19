import cloudinary from "../config/cloudinary.js";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

export const uploadImage = async (file, folder = "smart-inventory/products") => {
  if (!file || !file.buffer) {
    return null;
  }

  if (!env.cloudinaryEnabled) {
    throw new ApiError(500, "Cloudinary is not configured. Please set Cloudinary environment variables");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(500, "Image upload failed", error));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(file.buffer);
  });
};

export const deleteImage = async (publicId) => {
  if (!publicId || !env.cloudinaryEnabled) {
    return;
  }

  await cloudinary.uploader.destroy(publicId);
};

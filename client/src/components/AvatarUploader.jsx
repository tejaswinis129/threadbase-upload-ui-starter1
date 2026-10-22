
import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const inputRef = useRef(null);

  // Task 2: Validate the file before selecting it
  function handleFile(selectedFile) {
    if (!selectedFile) return;

    setError("");
    setUploadedUrl("");
    setProgress(0);

    if (!ALLOWED.includes(selectedFile.type)) {
      setFile(null);
      setPreview(null);
      setError("Only JPEG, PNG, WebP and GIF images are allowed.");
      return;
    }

    if (selectedFile.size > MAX_SIZE) {
      setFile(null);
      setPreview(null);
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }

  // Task 1: Drag-and-drop handlers
  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    handleFile(droppedFile);
  }

  // Task 3: Release preview URLs when changed or unmounted
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Task 4: Upload using Axios and show progress
  async function upload() {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    setError("");
    setProgress(0);
    setUploadedUrl("");

    try {
      const response = await apiClient.post(
        "/api/upload",
        formData,
        {
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round(
                (event.loaded * 100) / event.total
              );
              setProgress(percent);
            }
          },
        }
      );

      setProgress(100);

      // Adjust this if your server uses a different response shape.
      const url =
        response.data.url ??
        response.data.file?.url ??
        "";

      if (url) {
        setUploadedUrl(url);
      } else {
        setError("Upload completed, but no image URL was returned.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div
        className={
          isDragging ? "drop-zone dragging" : "drop-zone"
        }
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <p>
          {isDragging
            ? "Drop to upload"
            : "Drag an image here, or click to choose"}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>

      {file && (
        <p>Selected file: {file.name}</p>
      )}

      {preview && (
        <img
          src={preview}
          alt="Selected image preview"
          className="preview"
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button
        onClick={upload}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>

      {(uploading || progress > 0) && (
        <div>
          <p>Upload progress: {progress}%</p>
          <div
            className="bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {uploadedUrl && (
        <p>
          Upload successful!{" "}
          <a
            href={uploadedUrl}
            target="_blank"
            rel="noreferrer"
          >
            View uploaded image
          </a>
        </p>
      )}
    </div>
  );
}

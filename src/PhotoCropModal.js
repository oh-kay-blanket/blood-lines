import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

function getCroppedImg(imageSrc, croppedAreaPixels) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.src = imageSrc;
  });
}

const PhotoCropModal = ({ imageSrc, onSave, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
    onSave(croppedDataUrl);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content photo-crop-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 0.75rem", textAlign: "center" }}>
          Crop Photo
        </h3>

        <div className="crop-container">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="zoom-controls">
          <span className="material-icons-outlined" style={{ fontSize: "1rem", opacity: 0.6 }}>
            photo_size_select_small
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
          />
          <span className="material-icons-outlined" style={{ fontSize: "1.2rem", opacity: 0.6 }}>
            photo_size_select_large
          </span>
        </div>

        <div className="crop-actions">
          <button className="crop-btn crop-btn--cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="crop-btn crop-btn--save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropModal;

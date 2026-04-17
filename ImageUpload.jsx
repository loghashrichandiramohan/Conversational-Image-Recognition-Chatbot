import { useState } from 'react';

function ImageUpload({ onSubmit }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!image) return alert("Please select an image.");
    onSubmit(image);
  };

  return (
    <div
      style={{
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        padding: '25px',
        textAlign: 'center',
        borderRadius: '15px',
        width: '85%',
        margin: '20px auto',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        color: '#fff',
        animation: 'fadeInUp 0.6s ease-out',
      }}
    >
      <h3
        style={{
          fontSize: '22px',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #ff7eb3, #ff758c, #ff9770)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '15px',
        }}
      >
        📤 Upload Image
      </h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{
          display: 'block',
          margin: '0 auto',
          padding: '10px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      />

      {preview && (
        <img
          src={preview}
          alt="preview"
          style={{
            marginTop: '20px',
            maxWidth: '100%',
            borderRadius: '12px',
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
          }}
        />
      )}

      <br />
      <button
        onClick={handleUpload}
        style={{
          marginTop: '20px',
          padding: '12px 25px',
          background: 'linear-gradient(90deg, #00f2fe, #4facfe)',
          color: 'black',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 15px rgba(0, 242, 254, 0.5)';
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        Upload to Server
      </button>

      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}

export default ImageUpload;

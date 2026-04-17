function CaptionDisplay({ caption, audioUrl }) {
  if (!caption) return null;

  const playAudio = () => {
    if (audioUrl) {
      new Audio(audioUrl).play();
    }
  };

  return (
    <div
      style={{
        marginTop: '30px',
        padding: '25px',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '15px',
        width: '85%',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        color: '#fff',
        animation: 'fadeInUp 0.6s ease-out',
      }}
    >
      <h3
        style={{
          margin: '0',
          fontSize: '22px',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        📝 Semantic Captioning
      </h3>
      <p
        style={{
          fontSize: '18px',
          marginTop: '12px',
          color: '#f5f5f5',
          lineHeight: '1.6',
          textShadow: '0 1px 2px rgba(0,0,0,0.4)',
        }}
      >
        {caption}
      </p>

      {/* Play Again button */}
      {audioUrl && (
        <button
          onClick={playAudio}
          style={{
            marginTop: '15px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔊 Play Again
        </button>
      )}

      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default CaptionDisplay;

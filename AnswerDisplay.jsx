function AnswerDisplay({ answer }) {
  if (!answer) return null;

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
          background: 'linear-gradient(90deg, #ff7eb3, #ff758c, #ff9770)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        💬 AI Answer
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
        {answer}
      </p>

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

export default AnswerDisplay;

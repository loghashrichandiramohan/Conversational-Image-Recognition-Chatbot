import React from "react";

function QuestionSelector({ questions, onSelect }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div
      style={{
        marginTop: '30px',
        padding: '25px',
        width: '85%',
        marginLeft: 'auto',
        marginRight: 'auto',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '15px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeInUp 0.6s ease-out',
      }}
    >
      <h3
        style={{
          fontSize: '22px',
          fontWeight: '700',
          background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '15px',
        }}
      >
        🤖 Select a Question
      </h3>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '15px',
        }}
      >
        {questions.map((q, index) => (
          <button
            key={index}
            onClick={() => onSelect(q)}
            style={{
              padding: '12px 18px',
              background: 'linear-gradient(90deg, #ff7eb3, #ff758c, #ff9770)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              maxWidth: '320px',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 15px rgba(255, 126, 179, 0.5)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {q}
          </button>
        ))}
      </div>

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

export default QuestionSelector;

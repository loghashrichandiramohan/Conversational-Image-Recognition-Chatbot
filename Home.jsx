import { useState } from "react";
import CaptionDisplay from "../components/CaptionDisplay";
import QuestionSelector from "../components/QuestionSelector";
import AnswerDisplay from "../components/AnswerDisplay";
import ImageUpload from "../components/ImageUpload";

function Home() {
  const [reasoning, setReasoning] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [filename, setFilename] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  // -------------------------
  // Upload → Reasoning → Questions → Answer
  // -------------------------
const handleImageSubmit = async (file) => {
  setLoading(true);
  setReasoning(null);
  setQuestions([]);
  setAnswer(null);

  try {
    // 1️⃣ Generate caption + audio
    const formData = new FormData();
    formData.append("file", file);

    const analyzeRes = await fetch("http://localhost:8000/analyze-image", {
      method: "POST",
      body: formData,
    });

    if (!analyzeRes.ok) {
      console.error("Caption/audio generation failed:", await analyzeRes.text());
      setLoading(false);
      return;
    }

    const analyzeData = await analyzeRes.json();
    setReasoning(analyzeData.caption || "No caption generated");
    setAudioUrl(analyzeData.audio_url ? `http://localhost:8000${analyzeData.audio_url}` : null);

    // 🔊 Play caption first
    const playCaptionAudio = () => {
      return new Promise((resolve) => {
        if (analyzeData.audio_url) {
          const audio = new Audio(`http://localhost:8000${analyzeData.audio_url}`);
          audio.play();
          audio.onended = resolve;
        } else {
          const utterance = new SpeechSynthesisUtterance(analyzeData.caption || "");
          utterance.rate = 1;
          utterance.pitch = 1;
          utterance.onend = resolve;
          window.speechSynthesis.speak(utterance);
        }
      });
    };

    await playCaptionAudio(); // wait for caption to finish

    // 2️⃣ Generate reasoning + follow-up questions
    const reasoningForm = new FormData();
    reasoningForm.append("image", file);
    reasoningForm.append("user_question", "What is happening in the image?");

    const reasoningRes = await fetch("http://localhost:8000/reasoning-questions", {
      method: "POST",
      body: reasoningForm,
    });

    if (!reasoningRes.ok) {
      console.error("Reasoning generation failed:", await reasoningRes.text());
      return;
    }

    const reasoningData = await reasoningRes.json();
    setQuestions(reasoningData.generated_questions || []);
    setFilename(reasoningData.filename || file.name);

    // 🔊 Read out the questions after caption
    if (reasoningData.generated_questions && reasoningData.generated_questions.length > 0) {
      const questionText = `The questions are: ${reasoningData.generated_questions.join(". ")}`;
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }

  } catch (error) {
    console.error("Error in handleImageSubmit:", error);
  } finally {
    setLoading(false);
  }
};

// 🔹 Click handler for questions
const handleQuestionClick = (question) => {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(`The question clicked is: ${question}`);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

// 🔹 Render questions
<div>
  {questions.map((q, idx) => (
    <button
      key={idx}
      onClick={() => handleQuestionClick(q)}
      style={{ display: "block", margin: "5px 0", padding: "8px", cursor: "pointer" }}
    >
      {q}
    </button>
  ))}
</div>




  // 💬 When user selects a question → get answer
 const handleQuestionSelect = async (question) => {
  // 🔊 Speak the clicked question
  window.speechSynthesis.cancel();
  const questionUtterance = new SpeechSynthesisUtterance(
    `The question clicked is: ${question}`
  );
  questionUtterance.rate = 1;
  questionUtterance.pitch = 1;
  window.speechSynthesis.speak(questionUtterance);

  setSelectedQuestion(question);
  setAnswer(null);
  setLoading(true);

  try {
    if (!filename) throw new Error("No image uploaded yet.");

    const response = await fetch("http://localhost:8000/answer-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_filename: filename,
        image_question: question,
      }),
    });

    if (!response.ok) {
      console.error("Answer generation failed:", await response.text());
      setAnswer("Error generating answer.");
      return;
    }

    const data = await response.json();
    const finalAnswer = data.answer || "No answer generated";
    setAnswer(finalAnswer);

    // 🔊 Speak the answer after it arrives
    const answerUtterance = new SpeechSynthesisUtterance(
      `The answer is: ${finalAnswer}`
    );
    answerUtterance.rate = 1;
    answerUtterance.pitch = 1;

    // Wait until question speech finishes
    questionUtterance.onend = () => {
      window.speechSynthesis.speak(answerUtterance);
    };

  } catch (error) {
    console.error("Error in handleQuestionSelect:", error);
    setAnswer("Error generating answer.");
  } finally {
    setLoading(false);
  }
};


  // 🔊 Replay caption audio
  const handleReplayAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((err) => console.warn("Audio replay failed:", err));
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "950px",
          background: "rgba(255, 255, 255, 0.07)",
          borderRadius: "20px",
          padding: "40px",
          backdropFilter: "blur(15px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          color: "#fff",
          animation: "fadeIn 0.8s ease-in-out",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            fontSize: "40px",
            fontWeight: "700",
            background: "linear-gradient(90deg, #ff7eb3, #ff758c, #ff9770)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Conversational Image Recognition
        </h1>

        {/* Upload Section */}
        <div style={{ marginBottom: "25px" }}>
          <ImageUpload onSubmit={handleImageSubmit} />
        </div>

        {/* Replay Audio Button */}
        {audioUrl && (
          <button
            onClick={handleReplayAudio}
            style={{
              marginBottom: "25px",
              padding: "10px 20px",
              borderRadius: "10px",
              background: "#ff758c",
              border: "none",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            🔊 Replay Caption Audio
          </button>
        )}

        {/* Loader */}
        {loading && (
          <p style={{ textAlign: "center", color: "#ffecd1" }}>
            Processing image... please wait ⏳
          </p>
        )}

        {/* Semantic Captioning */}
        {reasoning && !loading && (
          <div style={{ marginTop: "25px" }}>
            <CaptionDisplay caption={reasoning} title="🧠 Semantic Captioning" />
          </div>
        )}

        {/* Generated Questions */}
        {questions.length > 0 && !loading && (
          <div style={{ marginTop: "25px" }}>
            <QuestionSelector questions={questions} onSelect={handleQuestionSelect} />
          </div>
        )}

        {/* Answer Display */}
        {answer && !loading && (
          <div style={{ marginTop: "25px" }}>
            <AnswerDisplay answer={answer} />
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

export default Home;

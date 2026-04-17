from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from uuid import uuid4
from PIL import Image
import io
import os
import torch
import uuid

# Transformers
from transformers import BlipProcessor, BlipForConditionalGeneration
from fastapi.staticfiles import StaticFiles

# Custom modules
from model.vqa_model import answer_question as custom_answer
from semantic_reasoning import (
    generate_semantic_reasoning_from_caption,
    generate_questions_from_reasoning,
)

# ---------------------------------------
# 🚀 FASTAPI APP INITIALIZATION
# ---------------------------------------
app = FastAPI(title="Conversational Image Recognition Chatbox")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
async def generate_caption_from_upload(file: UploadFile):
    content = await file.read()
    img = Image.open(io.BytesIO(content)).convert("RGB")

    inputs = caption_processor(img, return_tensors="pt")
    with torch.no_grad():
        out = caption_model.generate(**inputs, max_new_tokens=40)

    caption = caption_processor.decode(out[0], skip_special_tokens=True)
    return caption

# ---------------------------------------
# 🗂️ DIRECTORY SETUP
# ---------------------------------------
UPLOAD_DIR = "temp_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)



# ---------------------------------------
# 🧠 LOAD MODELS blip-base
# ---------------------------------------
caption_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
caption_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

# ---------------------------------------
# 🧩 ENDPOINT 1: Upload Image + Caption
# ---------------------------------------
@app.post("/upload-image")
async def upload_image(image: UploadFile = File(...)):
    """Uploads an image, generates a caption, and saves it."""
    content = await image.read()
    pil_image = Image.open(io.BytesIO(content)).convert("RGB")

    filename = f"{uuid4().hex}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    pil_image.save(filepath)

    inputs = caption_processor(pil_image, return_tensors="pt")
    out = caption_model.generate(**inputs)
    caption = caption_processor.decode(out[0], skip_special_tokens=True)

    return {"caption": caption, "filename": filename}

# ---------------------------------------
# 🧩 ENDPOINT 2:  Question Generation
# ---------------------------------------
from fastapi import Form

@app.post("/reasoning-questions")
async def reasoning_questions(image: UploadFile = File(...), user_question: str = Form(...)):
    content = await image.read()
    pil_image = Image.open(io.BytesIO(content)).convert("RGB")

    filename = f"{uuid4().hex}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    pil_image.save(filepath)

    inputs = caption_processor(pil_image, return_tensors="pt")
    out = caption_model.generate(**inputs)
    caption = caption_processor.decode(out[0], skip_special_tokens=True)

    reasoning = generate_semantic_reasoning_from_caption(caption, user_question)
    followups = generate_questions_from_reasoning(reasoning, num_questions=3)
    followups = [q.strip() for q in followups if q.strip()]

    return {
        "caption": caption,
        "reasoning": reasoning.strip(),
        "generated_questions": followups,
        "filename": filename
    }

   

# ---------------------------------------
# 🧩 ENDPOINT 3: Answer Question (VQA)
# ---------------------------------------
@app.post("/answer-question")
async def answer_question(payload: dict):
    """Answers a visual question using the fine-tuned model."""
    image_filename = payload["image_filename"]
    question = payload["image_question"]

    filepath = os.path.join(UPLOAD_DIR, image_filename)
    pil_image = Image.open(filepath).convert("RGB")

    answer = custom_answer(pil_image, question)
    return {"answer": answer}
# ---------------------------------------
# 🧩 ENDPOINT 4: Answer Question (VQA)
# ---------------------------------------
from statistics import mean
from nltk.translate.bleu_score import sentence_bleu, SmoothingFunction
from rouge_score import rouge_scorer
from pathlib import Path

smooth = SmoothingFunction().method4
rouge = rouge_scorer.RougeScorer(["rougeL"], use_stemmer=True)

def _bleu_n(pred, refs, n):
    # best BLEU-n across refs
    weights = {1:(1,0,0,0), 2:(0.5,0.5,0,0), 4:(0.25,0.25,0.25,0.25)}[n]
    s = []
    for ref in refs:
        s.append(sentence_bleu([ref.split()], pred.split(), weights=weights, smoothing_function=smooth))
    return max(s) if s else 0.0

def _rougeL(pred, refs):
    # best ROUGE-L F1 across refs
    scores = [rouge.score(ref, pred)["rougeL"].fmeasure for ref in refs]
    return max(scores) if scores else 0.0

@app.post("/eval-captioning")
async def eval_captioning(payload: dict):
    """
    payload = {
      "images": ["DS/COCO_test2014_000000000001.jpg", ...],
      "references": {"DS/COCO_test2014_000000000001.jpg": ["cap1","cap2","cap3"], ...}
    }
    """
    import time, torch
    base_dir = Path(__file__).parent / "dataset"
    b1_list, b2_list, b4_list, rL_list, t_ms = [], [], [], [], []

    device = "cuda" if torch.cuda.is_available() else "cpu"
    caption_model.to(device)

    for fname in payload["images"]:
        refs = payload["references"].get(fname)
        if not refs:
            return {"error": "Missing reference list for image", "key": fname}

        # robust path resolution
        candidates = [base_dir / fname, base_dir / Path(fname).name, base_dir / "DS" / Path(fname).name]
        img_path = next((p for p in candidates if p.exists()), None)
        if img_path is None:
            return {"error": "Image not found", "key": fname, "tried": [str(p) for p in candidates]}

        img = Image.open(str(img_path)).convert("RGB")

        t0 = time.perf_counter()
        with torch.no_grad():
            inputs = caption_processor(img, return_tensors="pt").to(device)
            out = caption_model.generate(**inputs, max_new_tokens=40)  # greedy, deterministic
        pred = caption_processor.decode(out[0], skip_special_tokens=True)


        # # ViT-GPT2 caption generation
        # with torch.no_grad():
        #  pixel_values = caption_processor(images=img, return_tensors="pt").to(device)
        #  out = caption_model.generate(**pixel_values, max_new_tokens=40, num_beams=5)
        #  pred = caption_tokenizer.decode(out[0], skip_special_tokens=True).strip()

        # OFA-Tiny caption generation
        
    # --- OFA-Tiny (robust across Transformers versions) ---
        # from transformers import AutoProcessor, OFAForConditionalGeneration
        # device = "cuda" if torch.cuda.is_available() else "cpu"

        # caption_model = OFAForConditionalGeneration.from_pretrained("OFA-Sys/ofa-tiny").to(device)
        # caption_processor = AutoProcessor.from_pretrained("OFA-Sys/ofa-tiny")

        # t_ms.append((time.perf_counter() - t0) * 1000)

        # # scores: best across 3 refs
        # b1 = _bleu_n(pred, refs, 1)
        # b2 = _bleu_n(pred, refs, 2)
        # b4 = _bleu_n(pred, refs, 4)
        # rL = _rougeL(pred, refs)

        # b1_list.append(b1); b2_list.append(b2); b4_list.append(b4); rL_list.append(rL)

    # accuracy: lenient but meaningful
    acc = 100 * mean([(b1 >= 0.6) or (rL >= 0.5) for b1, rL in zip(b1_list, rL_list)])

    return {
        "model": "BLIP-base",
        # "model": "ViT-GPT2",
        # "model": "OFA-Tiny",


        "samples": len(b1_list),
        "BLEU-1_mean_pct": round(100*mean(b1_list), 2),
        "BLEU-2_mean_pct": round(100*mean(b2_list), 2),
        "BLEU-4_mean_pct": round(100*mean(b4_list), 2),
        "ROUGE-L_mean_pct": round(100*mean(rL_list), 2),
        "Accuracy_pct(BLEU1>=0.6 or ROUGE-L>=0.5)": round(acc, 1),
        "Avg_inference_ms": round(mean(t_ms), 1),
    }

from fastapi import FastAPI, File, UploadFile
import os, io
from PIL import Image
from uuid import uuid4
from yolov8_detector import detect_objects

UPLOAD_DIR = "temp_images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/detect-objects")
async def detect_objects_endpoint(image: UploadFile = File(...)):
    content = await image.read()
    pil_image = Image.open(io.BytesIO(content)).convert("RGB")

    filename = f"{uuid4().hex}.jpg"
    filepath = os.path.join(UPLOAD_DIR, filename)
    pil_image.save(filepath)

    save_path = os.path.join(UPLOAD_DIR, f"annotated_{filename}")
    detections = detect_objects(filepath, save_path)

    return {
        "objects": detections,
        "annotated_image": f"/static/{os.path.basename(save_path)}"
    }

from gtts import gTTS

def caption_to_audio(caption_text: str):
    filename = f"{uuid.uuid4().hex}.mp3"
    file_path = os.path.join("static", filename)

    tts = gTTS(text=caption_text, lang="en")
    tts.save(file_path)

    return f"/static/{filename}"



@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    caption = await generate_caption_from_upload(file)
    audio_url = caption_to_audio(caption)

    return {
        "caption": caption,
        "audio_url": audio_url
    }





# # ---------------------------------------
# # 🧠 LOAD MODELS — ViT-GPT2
# # ---------------------------------------
# from transformers import VisionEncoderDecoderModel, ViTImageProcessor, AutoTokenizer

# device = "cuda" if torch.cuda.is_available() else "cpu"

# caption_model = VisionEncoderDecoderModel.from_pretrained(
#     "nlpconnect/vit-gpt2-image-captioning"
# ).to(device)

# caption_processor = ViTImageProcessor.from_pretrained(
#     "nlpconnect/vit-gpt2-image-captioning"
# )
# caption_tokenizer = AutoTokenizer.from_pretrained(
#     "nlpconnect/vit-gpt2-image-captioning"
# )

# # ---------------------------------------
# # 🧠 LOAD MODELS — OFA-Tiny
# # ---------------------------------------
# from transformers import OFAProcessor, OFAModel

# device = "cuda" if torch.cuda.is_available() else "cpu"

# caption_model = OFAModel.from_pretrained("OFA-Sys/ofa-tiny").to(device)
# caption_processor = OFAProcessor.from_pretrained("OFA-Sys/ofa-tiny")
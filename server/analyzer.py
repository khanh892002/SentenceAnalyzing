import sys
import spacy
import hashlib
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langdetect import detect, LangDetectException

app = FastAPI()

# SECURITY FIX: Restrict CORS
# Update these domains with your actual production frontend URL
ALLOWED_ORIGINS = [
    "http://localhost:5173", # Vite dev
    "http://localhost:3000", # Node proxy
    "http://localhost:4173", # Vite preview
    "https://syntax-analyzer-24163.firebaseapp.com",
    "https://syntax-analyzer-24163.web.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK for Global Cache
# This requires serviceAccountKey.json in the project root
SA_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'serviceAccountKey.json')
db = None

if os.path.exists(SA_KEY_PATH):
    try:
        cred = credentials.Certificate(SA_KEY_PATH)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase Admin: {e}")
else:
    print(f"WARNING: serviceAccountKey.json not found at {SA_KEY_PATH}. Global Cache will be disabled.")

try:
    # Load the English language model
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Model en_core_web_sm not found. Please run: python -m spacy download en_core_web_sm")
    sys.exit(1)

class SentenceRequest(BaseModel):
    sentence: str

def build_tree(token):
    node = {
        "role": token.dep_,
        "type": "word",
        "text": token.text,
        "pos": token.pos_
    }
    
    children = list(token.children)
    
    if children:
        node["type"] = "phrase"
        content = []
        
        all_tokens = children + [token]
        all_tokens.sort(key=lambda x: x.i)
        
        for child in all_tokens:
            if child == token:
                content.append({
                    "role": "head",
                    "type": "word",
                    "text": child.text,
                    "pos": child.pos_
                })
            else:
                content.append(build_tree(child))
                
        node["content"] = content
        if "text" in node:
            del node["text"]
            
    return node

def get_sentence_hash(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

@app.post("/analyze")
def analyze_sentence(request: SentenceRequest):
    text = request.sentence
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Sentence input is required.")
        
    # SECURITY FIX: Limit payload size
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Văn bản quá dài. Vui lòng nhập tối đa 5000 ký tự.")
        
    try:
        lang = detect(text)
        if lang != 'en':
            raise HTTPException(status_code=400, detail=f"Vui lòng nhập câu tiếng Anh (phát hiện ngôn ngữ: {lang}).")
    except LangDetectException:
        raise HTTPException(status_code=400, detail="Văn bản vô nghĩa hoặc không thể nhận diện ngôn ngữ.")
        
    doc = nlp(text)
    
    results = []
    for sent in doc.sents:
        sent_text = sent.text.strip()
        if not sent_text:
            continue
            
        sent_hash = get_sentence_hash(sent_text)
        cached_tree = None
        
        # 1. Check Global Cache in Firestore
        if db:
            doc_ref = db.collection('global_sentence_cache').document(sent_hash)
            doc_snap = doc_ref.get()
            if doc_snap.exists:
                cached_tree = doc_snap.to_dict().get('tree')
                
        if cached_tree:
            # Cache Hit
            results.append(cached_tree)
        else:
            # Cache Miss -> Run spaCy
            roots = [token for token in sent if token.dep_ == "ROOT"]
            if not roots:
                raise HTTPException(status_code=400, detail="Câu bị ngắt hoặc thiếu động từ chính (ROOT).")
                
            root = roots[0]
            tree = build_tree(root)
            
            # Save to Global Cache
            if db:
                try:
                    db.collection('global_sentence_cache').document(sent_hash).set({
                        'text': sent_text,
                        'tree': tree,
                        'version': '1.0',
                        'lang': 'en',
                        'createdAt': firestore.SERVER_TIMESTAMP
                    })
                except Exception as e:
                    print(f"Failed to cache sentence in Firestore: {e}")
                    
            results.append(tree)
        
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

import sys
import spacy
import hashlib
import sqlite3
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langdetect import detect, LangDetectException

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite Cache
conn = sqlite3.connect('sentence_cache.db', check_same_thread=False)
cursor = conn.cursor()
cursor.execute('''
    CREATE TABLE IF NOT EXISTS sentence_cache (
        hash TEXT PRIMARY KEY,
        tree_json TEXT
    )
''')
conn.commit()

try:
    # Load the English language model
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Model en_core_web_sm not found. Please run: python -m spacy download en_core_web_sm")
    sys.exit(1)

class SentenceRequest(BaseModel):
    sentence: str

def build_tree(token):
    """
    Recursively builds a tree from the spaCy token dependencies.
    """
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
        
        # Check SQLite cache
        cursor.execute("SELECT tree_json FROM sentence_cache WHERE hash = ?", (sent_hash,))
        cached_row = cursor.fetchone()
        
        if cached_row:
            # Cache Hit
            results.append(json.loads(cached_row[0]))
        else:
            # Cache Miss
            roots = [token for token in sent if token.dep_ == "ROOT"]
            if not roots:
                raise HTTPException(status_code=400, detail="Câu bị ngắt hoặc thiếu động từ chính (ROOT).")
                
            root = roots[0]
            tree = build_tree(root)
            
            # Save to cache
            cursor.execute("INSERT INTO sentence_cache (hash, tree_json) VALUES (?, ?)", (sent_hash, json.dumps(tree)))
            conn.commit()
            
            results.append(tree)
        
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

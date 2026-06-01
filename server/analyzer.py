import sys
import spacy
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langdetect import detect, LangDetectException

app = FastAPI()

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
    # Base node representing the current token
    node = {
        "role": token.dep_,
        "type": "word",
        "text": token.text,
        "pos": token.pos_
    }
    
    children = list(token.children)
    
    # If it has children, it forms a phrase
    if children:
        node["type"] = "phrase"
        content = []
        
        # Sort children and head by their position in the original sentence to maintain reading order
        all_tokens = children + [token]
        all_tokens.sort(key=lambda x: x.i)
        
        for child in all_tokens:
            if child == token:
                # This is the head word of the phrase
                content.append({
                    "role": "head",
                    "type": "word",
                    "text": child.text,
                    "pos": child.pos_
                })
            else:
                # Recursively parse child branches
                content.append(build_tree(child))
                
        node["content"] = content
        # If it's a phrase, the exact word is nested inside 'content', so remove it from the root of this node
        if "text" in node:
            del node["text"]
            
    return node

@app.post("/analyze")
def analyze_sentence(request: SentenceRequest):
    text = request.sentence
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Sentence input is required.")
        
    # Validation 1: Language Detection & Gibberish
    try:
        lang = detect(text)
        if lang != 'en':
            raise HTTPException(status_code=400, detail=f"Vui lòng nhập câu tiếng Anh (phát hiện ngôn ngữ: {lang}).")
    except LangDetectException:
        raise HTTPException(status_code=400, detail="Văn bản vô nghĩa hoặc không thể nhận diện ngôn ngữ.")
        
    doc = nlp(text)
    
    results = []
    # Process each sentence found in the input text
    for sent in doc.sents:
        # Validation 2: Fragment / Missing ROOT
        roots = [token for token in sent if token.dep_ == "ROOT"]
        if not roots:
            raise HTTPException(status_code=400, detail="Câu bị ngắt hoặc thiếu động từ chính (ROOT).")
            
        root = roots[0]
        tree = build_tree(root)
        results.append(tree)
        
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

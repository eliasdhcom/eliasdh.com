############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import uvicorn
import torch

app = FastAPI(title="LLM API")

generator = None

class PromptRequest(BaseModel):
    prompt: str
    max_length: int = 100

@app.post("/generate")
async def generate_text(request: PromptRequest):
    global generator
    try:
        if generator is None:
            generator = pipeline(
                'text-generation',
                model='HuggingFaceH4/zephyr-7b-beta',
                torch_dtype=torch.float16,
                device=-1
            )

        full_prompt = f"[INST] {request.prompt} [/INST]"
        
        result = generator(
            full_prompt,
            max_length=request.max_length + len(full_prompt),
            num_return_sequences=1,
            temperature=0.7,
            do_sample=True,
            pad_token_id=generator.tokenizer.eos_token_id
        )
        generated = result[0]['generated_text']
        if '[/INST]' in generated:
            generated_text = generated.split('[/INST]')[-1].strip()
        else:
            generated_text = generated[len(full_prompt):].strip()
        return {"generated_text": generated_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "This Icarus instance is running successfully."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
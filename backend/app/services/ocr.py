import google.generativeai as genai
import json
import os
from typing import Optional
from fastapi import UploadFile
from PIL import Image
import io

from ..core.config import settings
from ..schemas.ocr import ReceiptData, AnalyzedDocument, LineItem

class OCRService:
    def __init__(self):
        # Configure the Generative AI client
        # Use settings or fallback to env var
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
             # Try to get from settings if available
             if hasattr(settings, "GOOGLE_API_KEY") and settings.GOOGLE_API_KEY:
                 api_key = settings.GOOGLE_API_KEY
             elif hasattr(settings, "GEMINI_API_KEY") and settings.GEMINI_API_KEY:
                 api_key = settings.GEMINI_API_KEY
        
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash') # Use Flash for speed/cost efficiency
        else:
            self.model = None
            print("WARNING: GOOGLE_API_KEY not found. OCR features will not work.")

    async def analyze_image(self, file: UploadFile) -> AnalyzedDocument:
        if not self.model:
            raise ValueError("OCR Service not configured: Missing Google API Key")

        # Read file content
        content = await file.read()
        image = Image.open(io.BytesIO(content))

        # Prepare the prompt
        prompt = """
        Analyze this image. It is likely a receipt or invoice. 
        Extract the following information in JSON format:
        - merchant_name: string
        - date: YYYY-MM-DD
        - total_amount: number (float)
        - tax_amount: number (float)
        - currency: string (ISO code, e.g., USD, EUR)
        - category: string (suggest a category like 'Meals', 'Travel', 'Office Supplies', 'Software')
        - items: list of objects { description: string, sku: string (if available), quantity: number, unit_price: number, total_amount: number }
        
        Also calculate:
        - is_receipt: boolean (true if it looks like a valid receipt/invoice)
        - confidence_score: number (0.0 to 1.0)
        
        Return ONLY valid JSON. Do not include markdown formatting like ```json.
        """

        try:
            # Generate content
            response = self.model.generate_content([prompt, image])
            response_text = response.text
            
            # Clean up potential markdown formatting
            cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
            
            # Parse JSON
            data = json.loads(cleaned_text)
            
            # Convert to Pydantic model
            receipt_data = ReceiptData(**data)
            
            return AnalyzedDocument(
                filename=file.filename or "unknown",
                document_type="receipt" if receipt_data.is_receipt else "unknown",
                extracted_data=receipt_data,
                raw_text=response_text # Keep raw text for debugging if needed
            )
            
        except Exception as e:
            print(f"Error analyzing image: {str(e)}")
            # Return empty/failed structure rather than crashing
            return AnalyzedDocument(
                filename=file.filename or "unknown",
                document_type="error",
                extracted_data=ReceiptData(is_receipt=False, confidence_score=0.0),
                raw_text=str(e)
            )

ocr_service = OCRService()

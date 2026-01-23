from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from ...services.ocr import ocr_service
from ...schemas.ocr import AnalyzedDocument
from ...models.user import User, UserRole
from ...api import deps

router = APIRouter()

@router.post("/analyze", response_model=AnalyzedDocument)
async def analyze_document(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Analyze an uploaded document (receipt/invoice) using Generative AI (OCR).
    Extracts structured data like merchant, date, total, and line items.
    """
    if not file.content_type.startswith('image/') and file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image or PDF.")
    
    try:
        result = await ocr_service.analyze_image(file)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to analyze document")

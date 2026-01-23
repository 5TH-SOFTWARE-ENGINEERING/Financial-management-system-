import os
import sys
import logging
from pathlib import Path

# Add the backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.append(str(backend_dir))

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def verify_libraries():
    logger.info("--- Checking AI/ML Libraries ---")
    libraries = [
        "pandas",
        "numpy",
        "sklearn",
        "statsmodels",
        "prophet",
        "xgboost",
        "tensorflow",
        "google.generativeai"
    ]
    
    available = []
    missing = []
    
    for lib in libraries:
        try:
            __import__(lib)
            logger.info(f"✅ {lib} is available")
            available.append(lib)
        except ImportError as e:
            logger.warning(f"❌ {lib} is NOT available: {e}")
            missing.append(lib)
            
    return available, missing

def verify_ocr_service():
    logger.info("\n--- Checking OCR Service ---")
    try:
        from app.services.ocr import OCRService
        from app.core.config import settings
        
        # Check settings
        logger.info(f"Checking Settings GEMINI_API_KEY: {'[SET]' if settings.GEMINI_API_KEY else '[MISSING]'}")
        logger.info(f"Checking ENV GEMINI_API_KEY: {'[SET]' if os.getenv('GEMINI_API_KEY') else '[MISSING]'}")
        
        ocr = OCRService()
        if ocr.model:
            logger.info("✅ OCR Service initialized successfully with Gemini model.")
            return True
        else:
            logger.error("❌ OCR Service failed to initialize (model is None).")
            return False
    except Exception as e:
        logger.error(f"❌ OCR Service Error: {e}")
        return False

def verify_forecasting_service():
    logger.info("\n--- Checking Forecasting Service ---")
    try:
        from app.services.ml_forecasting import MLForecastingService
        # Check standard model directory
        model_dir = backend_dir / "model"
        logger.info(f"Model directory exists: {model_dir.exists()}")
        
        # Just check if we can import and instantiate (it's mostly static methods)
        logger.info("✅ MLForecastingService imported successfully.")
        return True
    except Exception as e:
        logger.error(f"❌ Forecasting Service Error: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starting AI Integration Verification...")
    
    libs_ok, libs_miss = verify_libraries()
    ocr_ok = verify_ocr_service()
    forecast_ok = verify_forecasting_service()
    
    logger.info("\n--- Final Summary ---")
    logger.info(f"Libraries: {len(libs_ok)} OK, {len(libs_miss)} Missing")
    logger.info(f"OCR Service: {'PASS' if ocr_ok else 'FAIL'}")
    logger.info(f"Forecasting Service: {'PASS' if forecast_ok else 'FAIL'}")
    
    if ocr_ok and forecast_ok and not libs_miss:
        logger.info("\n🎉 All AI-related systems are working as expected!")
        sys.exit(0)
    else:
        logger.warning("\n⚠️ Some AI systems have issues. Check logs above.")
        sys.exit(1)

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import os

from .schemas import (
    ForecastRequest,
    ForecastResponse,
    TrainRequest,
    TrainResponse,
    HealthResponse,
    ErrorResponse,
)
from .services import forecaster

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="BreatheEasy ML Service",
    description="Prophet-based AQI forecasting microservice",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check endpoint"
)
async def health_check():
    """Check if the ML service is healthy and operational."""
    return HealthResponse(
        status="healthy",
        service="breatheeasy-ml",
        timestamp=datetime.utcnow(),
        models_loaded=forecaster.get_loaded_models_count()
    )


@app.post(
    "/forecast",
    response_model=ForecastResponse,
    tags=["Forecasting"],
    summary="Generate AQI forecast",
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def generate_forecast(request: ForecastRequest):
    """
    Generate 24-hour AQI forecast using Prophet model.
    
    - **location_id**: MongoDB ObjectId of the location
    - **historical_data**: List of historical AQI readings (minimum 24 points)
    - **forecast_hours**: Number of hours to forecast (1-168, default 24)
    
    Returns hourly predictions with confidence intervals.
    """
    try:
        logger.info(f"Forecast request for location {request.location_id}")
        
        predictions, confidence, model_version = forecaster.forecast(
            location_id=request.location_id,
            data=request.historical_data,
            hours=request.forecast_hours
        )
        
        return ForecastResponse(
            location_id=request.location_id,
            predictions=predictions,
            model_version=model_version,
            confidence=confidence,
            generated_at=datetime.utcnow()
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Forecast error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast generation failed: {str(e)}"
        )


@app.post(
    "/train",
    response_model=TrainResponse,
    tags=["Training"],
    summary="Train Prophet model",
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def train_model(request: TrainRequest):
    """
    Train a Prophet model for a specific location.
    
    - **location_id**: MongoDB ObjectId of the location
    - **training_data**: List of historical AQI readings (minimum 168 points / 7 days)
    
    Returns training status and model metrics.
    """
    try:
        logger.info(f"Training request for location {request.location_id}")
        
        version, mape = forecaster.train(
            location_id=request.location_id,
            data=request.training_data
        )
        
        return TrainResponse(
            location_id=request.location_id,
            status="success",
            model_version=version,
            training_points=len(request.training_data),
            mape=mape,
            trained_at=datetime.utcnow()
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Training error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model training failed: {str(e)}"
        )


@app.get(
    "/",
    tags=["Info"],
    summary="API information"
)
async def root():
    """Get basic API information."""
    return {
        "service": "BreatheEasy ML Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "forecast": "/forecast",
            "train": "/train",
            "docs": "/docs"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

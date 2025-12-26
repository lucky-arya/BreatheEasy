from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class HistoricalDataPoint(BaseModel):
    """Single historical data point for training/forecasting."""
    ds: datetime = Field(..., description="Timestamp")
    y: float = Field(..., ge=0, le=500, description="AQI value")
    temperature: Optional[float] = Field(None, description="Temperature in Celsius")
    humidity: Optional[float] = Field(None, ge=0, le=100, description="Humidity percentage")
    wind_speed: Optional[float] = Field(None, ge=0, description="Wind speed in m/s")


class ForecastRequest(BaseModel):
    """Request body for forecast endpoint."""
    location_id: str = Field(..., description="MongoDB location ID")
    historical_data: List[HistoricalDataPoint] = Field(
        ..., 
        min_length=24,
        description="Historical AQI data points"
    )
    forecast_hours: int = Field(
        default=24,
        ge=1,
        le=168,
        description="Number of hours to forecast"
    )


class TrainRequest(BaseModel):
    """Request body for model training."""
    location_id: str = Field(..., description="MongoDB location ID")
    training_data: List[HistoricalDataPoint] = Field(
        ...,
        min_length=168,
        description="Training data (minimum 7 days)"
    )


class PredictionPoint(BaseModel):
    """Single prediction point in forecast response."""
    timestamp: datetime
    aqi: float = Field(..., ge=0)
    aqi_lower: float = Field(..., ge=0)
    aqi_upper: float


class ForecastResponse(BaseModel):
    """Response body for forecast endpoint."""
    location_id: str
    predictions: List[PredictionPoint]
    model_version: str = "1.0.0"
    confidence: float = Field(..., ge=0, le=1)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TrainResponse(BaseModel):
    """Response body for training endpoint."""
    location_id: str
    status: str
    model_version: str
    training_points: int
    mape: Optional[float] = None
    trained_at: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Response body for health check."""
    status: str = "healthy"
    service: str = "breatheeasy-ml"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    models_loaded: int = 0


class ErrorResponse(BaseModel):
    """Error response body."""
    success: bool = False
    error: str
    detail: Optional[str] = None

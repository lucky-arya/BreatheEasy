import pandas as pd
import numpy as np
from prophet import Prophet
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import pickle
import os
import logging

from ..schemas import HistoricalDataPoint, PredictionPoint

logger = logging.getLogger(__name__)


class ProphetForecaster:
    """Prophet-based AQI forecasting service."""
    
    def __init__(self, models_dir: str = "./models"):
        self.models_dir = models_dir
        self.models: Dict[str, Prophet] = {}
        self.model_versions: Dict[str, str] = {}
        os.makedirs(models_dir, exist_ok=True)
    
    def _prepare_dataframe(
        self, 
        data: List[HistoricalDataPoint],
        include_weather: bool = True
    ) -> pd.DataFrame:
        """Convert historical data to Prophet-compatible DataFrame."""
        records = []
        for point in data:
            record = {
                'ds': point.ds,
                'y': point.y
            }
            if include_weather:
                if point.temperature is not None:
                    record['temperature'] = point.temperature
                if point.humidity is not None:
                    record['humidity'] = point.humidity
                if point.wind_speed is not None:
                    record['wind_speed'] = point.wind_speed
            records.append(record)
        
        df = pd.DataFrame(records)
        df['ds'] = pd.to_datetime(df['ds'])
        df = df.sort_values('ds').reset_index(drop=True)
        
        return df
    
    def _create_model(self, df: pd.DataFrame) -> Prophet:
        """Create and configure Prophet model."""
        model = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10,
            holidays_prior_scale=10,
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=False,
            interval_width=0.80,
        )
        
        # Add regressors if available
        if 'temperature' in df.columns and df['temperature'].notna().sum() > 0:
            model.add_regressor('temperature')
        if 'humidity' in df.columns and df['humidity'].notna().sum() > 0:
            model.add_regressor('humidity')
        if 'wind_speed' in df.columns and df['wind_speed'].notna().sum() > 0:
            model.add_regressor('wind_speed')
        
        return model
    
    def train(
        self, 
        location_id: str, 
        data: List[HistoricalDataPoint]
    ) -> Tuple[str, Optional[float]]:
        """Train Prophet model for a location."""
        logger.info(f"Training model for location {location_id} with {len(data)} points")
        
        df = self._prepare_dataframe(data)
        
        # Drop rows with NaN in target
        df = df.dropna(subset=['y'])
        
        if len(df) < 168:  # Minimum 7 days of hourly data
            raise ValueError(f"Insufficient data: {len(df)} points (need at least 168)")
        
        model = self._create_model(df)
        
        # Fill NaN regressors with median
        for col in ['temperature', 'humidity', 'wind_speed']:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())
        
        # Fit model
        model.fit(df)
        
        # Store model
        self.models[location_id] = model
        version = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        self.model_versions[location_id] = version
        
        # Calculate MAPE on training data
        mape = self._calculate_mape(model, df)
        
        # Save model to disk
        self._save_model(location_id, model, version)
        
        logger.info(f"Model trained for {location_id}, version {version}, MAPE: {mape:.2f}%")
        
        return version, mape
    
    def forecast(
        self, 
        location_id: str, 
        data: List[HistoricalDataPoint],
        hours: int = 24
    ) -> Tuple[List[PredictionPoint], float, str]:
        """Generate AQI forecast."""
        logger.info(f"Generating {hours}-hour forecast for location {location_id}")
        
        # Try to load existing model
        model = self.models.get(location_id)
        version = self.model_versions.get(location_id, "1.0.0")
        
        if model is None:
            model = self._load_model(location_id)
            if model:
                self.models[location_id] = model
        
        df = self._prepare_dataframe(data)
        
        # If no model exists, train a new one
        if model is None:
            if len(df) >= 168:
                version, _ = self.train(location_id, data)
                model = self.models[location_id]
            else:
                # Use simple model for limited data
                model = self._create_model(df)
                for col in ['temperature', 'humidity', 'wind_speed']:
                    if col in df.columns:
                        df[col] = df[col].fillna(df[col].median())
                model.fit(df)
                self.models[location_id] = model
                version = "simple_" + datetime.utcnow().strftime("%Y%m%d")
        
        # Create future dataframe
        future = model.make_future_dataframe(periods=hours, freq='h')
        
        # Fill regressors for future periods
        for col in ['temperature', 'humidity', 'wind_speed']:
            if col in df.columns:
                # Use last known values for future
                last_value = df[col].iloc[-1] if not pd.isna(df[col].iloc[-1]) else df[col].median()
                if col not in future.columns:
                    future[col] = last_value
                else:
                    future[col] = future[col].fillna(last_value)
        
        # Generate forecast
        forecast_df = model.predict(future)
        
        # Get only future predictions
        future_mask = forecast_df['ds'] > df['ds'].max()
        future_forecast = forecast_df[future_mask].head(hours)
        
        # Convert to response format
        predictions = []
        for _, row in future_forecast.iterrows():
            # Clamp AQI values to valid range
            aqi = max(0, min(500, row['yhat']))
            aqi_lower = max(0, row['yhat_lower'])
            aqi_upper = min(600, row['yhat_upper'])
            
            predictions.append(PredictionPoint(
                timestamp=row['ds'].to_pydatetime(),
                aqi=round(aqi, 1),
                aqi_lower=round(aqi_lower, 1),
                aqi_upper=round(aqi_upper, 1)
            ))
        
        # Calculate confidence based on prediction intervals
        avg_interval = np.mean([p.aqi_upper - p.aqi_lower for p in predictions])
        confidence = max(0.5, min(0.95, 1 - (avg_interval / 200)))
        
        return predictions, confidence, version
    
    def _calculate_mape(self, model: Prophet, df: pd.DataFrame) -> float:
        """Calculate Mean Absolute Percentage Error."""
        try:
            forecast = model.predict(df)
            actual = df['y'].values
            predicted = forecast['yhat'].values
            
            # Avoid division by zero
            mask = actual > 0
            mape = np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100
            
            return float(mape)
        except Exception as e:
            logger.warning(f"Could not calculate MAPE: {e}")
            return 0.0
    
    def _save_model(self, location_id: str, model: Prophet, version: str) -> None:
        """Save model to disk."""
        try:
            filepath = os.path.join(self.models_dir, f"{location_id}_{version}.pkl")
            with open(filepath, 'wb') as f:
                pickle.dump(model, f)
            logger.debug(f"Model saved to {filepath}")
        except Exception as e:
            logger.warning(f"Could not save model: {e}")
    
    def _load_model(self, location_id: str) -> Optional[Prophet]:
        """Load latest model from disk."""
        try:
            # Find latest model file for location
            files = [f for f in os.listdir(self.models_dir) if f.startswith(location_id)]
            if not files:
                return None
            
            latest_file = sorted(files)[-1]
            filepath = os.path.join(self.models_dir, latest_file)
            
            with open(filepath, 'rb') as f:
                model = pickle.load(f)
            
            # Extract version from filename
            version = latest_file.replace(f"{location_id}_", "").replace(".pkl", "")
            self.model_versions[location_id] = version
            
            logger.debug(f"Model loaded from {filepath}")
            return model
        except Exception as e:
            logger.warning(f"Could not load model: {e}")
            return None
    
    def get_loaded_models_count(self) -> int:
        """Get number of models currently loaded in memory."""
        return len(self.models)


# Singleton instance
forecaster = ProphetForecaster()

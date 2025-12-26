import axios from 'axios';
import { Location, AQReading, Sensor } from '../models/index.js';
import logger from '../config/logger.js';
import config from '../config/index.js';
import { mlService } from './mlService.js';

// OpenAQ API v3
const OPENAQ_BASE_URL = 'https://api.openaq.org/v3';

// Country code to ID mapping for OpenAQ v3
const COUNTRY_ID_MAP: Record<string, number> = {
  'US': 155,  // United States
  'IN': 9,    // India (correct ID)
  'CN': 37,   // China
  'GB': 77,   // United Kingdom
  'DE': 61,   // Germany
  'FR': 74,   // France
  'JP': 112,  // Japan
  'AU': 8,    // Australia
  'CA': 36,   // Canada
  'BR': 29,   // Brazil
  'GH': 152,  // Ghana
  'ZA': 111,  // South Africa
  'PL': 130,  // Poland
  'RO': 139,  // Romania
};

interface OpenAQV3Location {
  id: number;
  name: string;
  locality: string | null;
  timezone: string;
  country: {
    id: number;
    code: string;
    name: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensors: {
    id: number;
    name: string;
    parameter: {
      id: number;
      name: string;
      units: string;
      displayName: string;
    };
  }[];
  datetimeFirst: { utc: string; local: string } | null;
  datetimeLast: { utc: string; local: string } | null;
}

interface OpenAQV3LatestMeasurement {
  datetime: {
    utc: string;
    local: string;
  };
  value: number;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensorsId: number;
  locationsId: number;
}

interface OpenAQV3Response<T> {
  meta: { 
    name: string;
    website: string;
    page: number;
    limit: number;
    found: number;
  };
  results: T[];
}

// AQI calculation based on EPA standards
function calculateAQI(pm25: number): number {
  const breakpoints = [
    { low: 0, high: 12, aqiLow: 0, aqiHigh: 50 },
    { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100 },
    { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150 },
    { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200 },
    { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300 },
    { low: 250.5, high: 500.4, aqiLow: 301, aqiHigh: 500 },
  ];

  for (const bp of breakpoints) {
    if (pm25 >= bp.low && pm25 <= bp.high) {
      return Math.round(
        ((bp.aqiHigh - bp.aqiLow) / (bp.high - bp.low)) * (pm25 - bp.low) + bp.aqiLow
      );
    }
  }
  return 500; // Maximum AQI
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

export async function fetchOpenAQData(
  country: string = 'US',
  limit: number = 100
): Promise<void> {
  try {
    const countryId = COUNTRY_ID_MAP[country] || 155; // Default to US
    logger.info(`Fetching OpenAQ v3 data for country: ${country} (ID: ${countryId})`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // OpenAQ v3 requires API key in X-API-Key header
    if (config.openaqApiKey) {
      headers['X-API-Key'] = config.openaqApiKey;
    } else {
      logger.warn('No OpenAQ API key configured. API calls may be rate limited.');
    }

    // OpenAQ v3: Fetch locations with PM2.5 sensors (parameter id 2)
    const locationsResponse = await axios.get<OpenAQV3Response<OpenAQV3Location>>(
      `${OPENAQ_BASE_URL}/locations`,
      {
        headers,
        params: {
          countries_id: countryId,
          parameters_id: 2, // PM2.5 parameter ID in v3
          limit: Math.min(limit, 100),
        },
      }
    );

    const locations = locationsResponse.data.results;
    logger.info(`Found ${locations.length} locations from OpenAQ v3 for ${country}`);

    for (const loc of locations) {
      try {
        // Upsert location
        let location = await Location.findOne({
          'metadata.externalId': String(loc.id),
        });

        if (!location) {
          location = await Location.create({
            name: loc.name,
            city: loc.locality || loc.name,
            country: loc.country.name,
            countryCode: loc.country.code,
            coordinates: {
              type: 'Point',
              coordinates: [
                loc.coordinates.longitude,
                loc.coordinates.latitude,
              ],
            },
            metadata: {
              source: 'openaq',
              externalId: String(loc.id),
            },
          });
          logger.debug(`Created new location: ${location.name}`);
        }

        // Fetch latest measurements for this location
        const latestResponse = await axios.get<OpenAQV3Response<OpenAQV3LatestMeasurement>>(
          `${OPENAQ_BASE_URL}/locations/${loc.id}/latest`,
          { headers }
        );

        const latestMeasurements = latestResponse.data.results;

        // Find PM2.5 sensor ID for this location
        const pm25Sensor = loc.sensors.find(s => s.parameter.name === 'pm25');
        
        for (const m of latestMeasurements) {
          // Only process PM2.5 readings (sensorsId should match pm25 sensor)
          if (pm25Sensor && m.sensorsId === pm25Sensor.id) {
            const aqi = calculateAQI(m.value);
            const timestamp = new Date(m.datetime.utc);

            // Check if reading already exists
            const existingReading = await AQReading.findOne({
              locationId: location._id,
              timestamp,
            });

            if (!existingReading) {
              await AQReading.create({
                locationId: location._id,
                timestamp,
                aqi,
                aqiCategory: getAQICategory(aqi),
                pollutants: {
                  pm25: m.value,
                },
                metadata: {
                  source: 'openaq',
                  quality: 'preliminary',
                },
              });
              logger.debug(`Added reading for ${location.name}: PM2.5=${m.value}, AQI=${aqi}`);
            }
          }
        }

        // Trigger ML forecast for this location
        try {
          await mlService.triggerForecast(location._id.toString());
        } catch (error) {
          logger.error(`Failed to trigger forecast for location ${location._id}:`, error);
        }

        // Add delay between location requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (locError: any) {
        logger.error(`Error processing location ${loc.id}: ${locError.message}`);
      }
    }

    logger.info(`Data ingestion completed for ${country}`);
  } catch (error: any) {
    logger.error(`Error fetching OpenAQ v3 data: ${error.message}`);
    throw error;
  }
}

export async function ingestFromMultipleCountries(): Promise<void> {
  // Use country codes that map to OpenAQ v3 country IDs
  const countries = Object.keys(COUNTRY_ID_MAP);
  
  for (const country of countries) {
    try {
      await fetchOpenAQData(country, 20); // Fetch 20 locations per country
      // Add delay to respect rate limits (v3 has stricter limits)
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      logger.error(`Failed to fetch data for country ${country}: ${error.message}`);
    }
  }
  
  logger.info('Multi-country ingestion completed');
}

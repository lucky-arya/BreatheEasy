// MongoDB Initialization Script
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('breatheeasy');

// Create collections with validation
db.createCollection('locations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'city', 'country', 'coordinates'],
      properties: {
        name: { bsonType: 'string' },
        city: { bsonType: 'string' },
        country: { bsonType: 'string' },
        countryCode: { bsonType: 'string' },
        coordinates: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: { enum: ['Point'] },
            coordinates: {
              bsonType: 'array',
              items: { bsonType: 'double' }
            }
          }
        },
        isActive: { bsonType: 'bool' }
      }
    }
  }
});

db.createCollection('sensors');
db.createCollection('aq_readings');
db.createCollection('predictions');
db.createCollection('users');
db.createCollection('alerts');

// Create indexes

// Locations indexes
db.locations.createIndex({ 'coordinates': '2dsphere' });
db.locations.createIndex({ 'city': 'text', 'name': 'text', 'country': 'text' });
db.locations.createIndex({ 'isActive': 1 });
db.locations.createIndex({ 'metadata.externalId': 1 });

// Sensors indexes
db.sensors.createIndex({ 'locationId': 1, 'isActive': 1 });
db.sensors.createIndex({ 'sensorId': 1 }, { unique: true });

// AQ Readings indexes (time-series optimized)
db.aq_readings.createIndex({ 'locationId': 1, 'timestamp': -1 });
db.aq_readings.createIndex({ 'timestamp': -1 });
db.aq_readings.createIndex({ 'aqi': 1, 'timestamp': -1 });

// Predictions indexes
db.predictions.createIndex({ 'locationId': 1, 'generatedAt': -1 });
db.predictions.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });

// Users indexes
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'preferences.notificationsEnabled': 1, 'isActive': 1 });

// Alerts indexes
db.alerts.createIndex({ 'locationId': 1, 'isActive': 1, 'triggeredAt': -1 });
db.alerts.createIndex({ 'userId': 1, 'isActive': 1, 'triggeredAt': -1 });
db.alerts.createIndex({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });

// Insert some sample data for testing
db.locations.insertMany([
  {
    name: 'Central Park Monitor',
    city: 'New York',
    country: 'United States',
    countryCode: 'US',
    coordinates: {
      type: 'Point',
      coordinates: [-73.9654, 40.7829]
    },
    timezone: 'America/New_York',
    isActive: true,
    metadata: {
      source: 'sample',
      externalId: 'sample-1'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Delhi Air Quality',
    city: 'New Delhi',
    country: 'India',
    countryCode: 'IN',
    coordinates: {
      type: 'Point',
      coordinates: [77.2090, 28.6139]
    },
    timezone: 'Asia/Kolkata',
    isActive: true,
    metadata: {
      source: 'sample',
      externalId: 'sample-2'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'Beijing Monitoring Station',
    city: 'Beijing',
    country: 'China',
    countryCode: 'CN',
    coordinates: {
      type: 'Point',
      coordinates: [116.4074, 39.9042]
    },
    timezone: 'Asia/Shanghai',
    isActive: true,
    metadata: {
      source: 'sample',
      externalId: 'sample-3'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'London Air Quality',
    city: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    coordinates: {
      type: 'Point',
      coordinates: [-0.1276, 51.5074]
    },
    timezone: 'Europe/London',
    isActive: true,
    metadata: {
      source: 'sample',
      externalId: 'sample-4'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Insert sample AQ readings
const locations = db.locations.find().toArray();
const now = new Date();

locations.forEach(location => {
  const readings = [];
  for (let i = 0; i < 168; i++) { // 7 days of hourly data
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    const baseAqi = Math.floor(Math.random() * 100) + 30;
    const aqi = Math.max(0, Math.min(500, baseAqi + Math.floor(Math.random() * 40) - 20));
    
    let aqiCategory;
    if (aqi <= 50) aqiCategory = 'good';
    else if (aqi <= 100) aqiCategory = 'moderate';
    else if (aqi <= 150) aqiCategory = 'unhealthy_sensitive';
    else if (aqi <= 200) aqiCategory = 'unhealthy';
    else if (aqi <= 300) aqiCategory = 'very_unhealthy';
    else aqiCategory = 'hazardous';
    
    readings.push({
      locationId: location._id,
      timestamp: timestamp,
      aqi: aqi,
      aqiCategory: aqiCategory,
      pollutants: {
        pm25: aqi * 0.5 + Math.random() * 10,
        pm10: aqi * 0.8 + Math.random() * 20
      },
      metadata: {
        source: 'sample',
        quality: 'preliminary'
      },
      createdAt: timestamp
    });
  }
  db.aq_readings.insertMany(readings);
});

print('MongoDB initialization completed!');
print(`Created ${db.locations.countDocuments()} locations`);
print(`Created ${db.aq_readings.countDocuments()} readings`);

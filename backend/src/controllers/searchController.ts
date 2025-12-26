import { Request, Response } from 'express';
import { Location } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

export const searchLocations = asyncHandler(async (req: Request, res: Response) => {
  const { q, limit = 10 } = req.query;
  const searchQuery = (q as string).trim();
  const resultLimit = Math.min(parseInt(limit as string) || 10, 50);

  // Text search on city, name, country
  const locations = await Location.find(
    {
      $text: { $search: searchQuery },
      isActive: true,
    },
    {
      score: { $meta: 'textScore' },
    }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(resultLimit)
    .lean();

  // If no text search results, try regex search
  if (locations.length === 0) {
    const regexLocations = await Location.find({
      $or: [
        { city: { $regex: searchQuery, $options: 'i' } },
        { name: { $regex: searchQuery, $options: 'i' } },
        { country: { $regex: searchQuery, $options: 'i' } },
      ],
      isActive: true,
    })
      .limit(resultLimit)
      .lean();

    return res.json({
      success: true,
      data: regexLocations,
      meta: {
        query: searchQuery,
        count: regexLocations.length,
      },
    });
  }

  res.json({
    success: true,
    data: locations,
    meta: {
      query: searchQuery,
      count: locations.length,
    },
  });
});

export const searchByCoordinates = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius = 25 } = req.query;

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const radiusKm = parseInt(radius as string);

  const locations = await Location.find({
    coordinates: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
    isActive: true,
  })
    .limit(20)
    .lean();

  res.json({
    success: true,
    data: locations,
    meta: {
      center: { lat: latitude, lng: longitude },
      radiusKm,
      count: locations.length,
    },
  });
});

export const reverseGeocode = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  // Find closest location
  const closest = await Location.findOne({
    coordinates: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
    },
    isActive: true,
  }).lean();

  if (!closest) {
    return res.status(404).json({
      success: false,
      error: 'No nearby locations found',
    });
  }

  res.json({
    success: true,
    data: closest,
  });
});

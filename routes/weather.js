const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

const VALID_CITIES = [
  'Berlin',
  'Munich',
  'Hamburg',
  'Frankfurt',
  'Cologne',
  'Stuttgart',
  'Dresden',
  'Leipzig',
];

function normalizeCity(city) {
  const lower = city.toLowerCase();
  return VALID_CITIES.find((c) => c.toLowerCase() === lower) || null;
}

// GET /api/weather/:city - Fetch current weather from OpenWeatherMap, save to DB, return to client
router.get('/:city', async (req, res) => {
  try {
    const city = normalizeCity(req.params.city);
    if (!city) {
      return res.status(400).json({
        error: `Invalid city. Choose from: ${VALID_CITIES.join(', ')}`,
      });
    }

    const url = `${BASE_URL}?q=${encodeURIComponent(city)},DE&appid=${OPENWEATHER_API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({
        error: errorData.message || 'Failed to fetch weather data',
      });
    }

    const data = await response.json();

    const weatherRecord = new Weather({
      city: city,
      temperature: Math.round(data.main.temp * 10) / 10,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed * 10) / 10,
      icon: data.weather[0].icon,
      timestamp: new Date(),
    });

    await weatherRecord.save();

    res.json({
      city: weatherRecord.city,
      temperature: weatherRecord.temperature,
      description: weatherRecord.description,
      humidity: weatherRecord.humidity,
      wind_speed: weatherRecord.wind_speed,
      icon: weatherRecord.icon,
      timestamp: weatherRecord.timestamp,
    });
  } catch (err) {
    console.error('Error fetching weather:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/weather/history/:city - Get saved weather history from MongoDB
router.get('/history/:city', async (req, res) => {
  try {
    const city = normalizeCity(req.params.city);
    if (!city) {
      return res.status(400).json({
        error: `Invalid city. Choose from: ${VALID_CITIES.join(', ')}`,
      });
    }

    const history = await Weather.find({ city })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

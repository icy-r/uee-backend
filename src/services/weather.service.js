const axios = require('axios');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for a location
   */
  async getCurrentWeather(location) {
    try {
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: location || process.env.DEFAULT_LOCATION || 'Colombo,LK',
          appid: this.apiKey,
          units: 'metric'
        }
      });

      const data = response.data;
      
      return {
        location: data.name,
        country: data.sys.country,
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        wind: {
          speed: data.wind.speed,
          direction: data.wind.deg
        },
        clouds: data.clouds.all,
        visibility: data.visibility,
        timestamp: new Date(data.dt * 1000),
        constructionImpact: this.assessConstructionImpact(data)
      };
    } catch (error) {
      console.error('Weather API error:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather forecast for the next 5 days
   */
  async getForecast(location, days = 5) {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: location || process.env.DEFAULT_LOCATION || 'Colombo,LK',
          appid: this.apiKey,
          units: 'metric',
          cnt: days * 8 // 8 forecasts per day (every 3 hours)
        }
      });

      const forecasts = response.data.list.map(item => ({
        date: new Date(item.dt * 1000),
        temperature: item.main.temp,
        weather: item.weather[0].description,
        windSpeed: item.wind.speed,
        humidity: item.main.humidity,
        rainProbability: item.pop * 100
      }));

      // Group by day
      const dailyForecasts = this.groupForecastsByDay(forecasts);

      return {
        location: response.data.city.name,
        country: response.data.city.country,
        forecasts: dailyForecasts,
        workableDay: this.assessWorkableDays(dailyForecasts)
      };
    } catch (error) {
      console.error('Weather forecast error:', error.message);
      throw new Error('Failed to fetch weather forecast');
    }
  }

  /**
   * Assess construction impact based on weather conditions
   */
  assessConstructionImpact(weatherData) {
    const impacts = [];
    let overallImpact = 'low';

    // Check temperature
    if (weatherData.main.temp > 35) {
      impacts.push('High temperature may affect worker productivity');
      overallImpact = 'medium';
    } else if (weatherData.main.temp < 10) {
      impacts.push('Low temperature may slow concrete curing');
      overallImpact = 'medium';
    }

    // Check rain
    if (weatherData.weather[0].main === 'Rain') {
      impacts.push('Rain may delay outdoor construction activities');
      overallImpact = 'high';
    }

    // Check wind
    if (weatherData.wind.speed > 10) {
      impacts.push('Strong winds may affect high-altitude work');
      overallImpact = overallImpact === 'high' ? 'high' : 'medium';
    }

    // Check humidity
    if (weatherData.main.humidity > 80) {
      impacts.push('High humidity may affect paint and coating work');
      if (overallImpact === 'low') overallImpact = 'medium';
    }

    return {
      level: overallImpact,
      impacts: impacts.length > 0 ? impacts : ['Good conditions for construction'],
      workable: overallImpact !== 'high',
      recommendations: this.getWeatherRecommendations(weatherData, overallImpact)
    };
  }

  /**
   * Get weather-based recommendations
   */
  getWeatherRecommendations(weatherData, impactLevel) {
    const recommendations = [];

    if (impactLevel === 'high') {
      recommendations.push('Consider postponing outdoor activities');
      recommendations.push('Focus on indoor tasks');
    } else if (impactLevel === 'medium') {
      recommendations.push('Monitor weather conditions closely');
      recommendations.push('Have backup indoor tasks ready');
    }

    if (weatherData.main.temp > 30) {
      recommendations.push('Ensure adequate hydration for workers');
      recommendations.push('Schedule heavy work during cooler hours');
    }

    if (weatherData.weather[0].main === 'Rain') {
      recommendations.push('Protect materials from water damage');
      recommendations.push('Ensure proper site drainage');
    }

    return recommendations;
  }

  /**
   * Group forecasts by day
   */
  groupForecastsByDay(forecasts) {
    const grouped = {};

    forecasts.forEach(forecast => {
      const dateKey = forecast.date.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          temperatures: [],
          conditions: [],
          windSpeeds: [],
          rainProbabilities: []
        };
      }

      grouped[dateKey].temperatures.push(forecast.temperature);
      grouped[dateKey].conditions.push(forecast.weather);
      grouped[dateKey].windSpeeds.push(forecast.windSpeed);
      grouped[dateKey].rainProbabilities.push(forecast.rainProbability);
    });

    return Object.values(grouped).map(day => ({
      date: day.date,
      avgTemperature: (day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length).toFixed(1),
      maxTemperature: Math.max(...day.temperatures).toFixed(1),
      minTemperature: Math.min(...day.temperatures).toFixed(1),
      dominantCondition: this.getMostFrequent(day.conditions),
      maxWindSpeed: Math.max(...day.windSpeeds).toFixed(1),
      maxRainProbability: Math.max(...day.rainProbabilities).toFixed(0)
    }));
  }

  /**
   * Assess workable days in forecast
   */
  assessWorkableDays(forecasts) {
    return forecasts.map(day => ({
      date: day.date,
      workable: parseFloat(day.maxRainProbability) < 60 && parseFloat(day.maxWindSpeed) < 15,
      confidence: parseFloat(day.maxRainProbability) < 30 ? 'high' : 'medium'
    }));
  }

  /**
   * Get most frequent item in array
   */
  getMostFrequent(arr) {
    const frequency = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  }
}

module.exports = new WeatherService();


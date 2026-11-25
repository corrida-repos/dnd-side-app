import type { Weather } from './weather';

export const WEATHER_STAGES = {
  precip: ['Clear', 'Light clouds', 'Overcast or ground fog', 'Rain, hail, or snow', 'Torrential rain, driving hail, or blizzard'],
  temperature: ['Heat wave', 'Hot', 'Warm', 'Cool', 'Cold', 'Freezing'],
  wind: ['Calm', 'Moderate wind', 'Strong wind', 'Gale', 'Storm'],
} as const;

export type WeatherAxis = keyof typeof WEATHER_STAGES;
export type WeatherStages = Record<WeatherAxis, number>;
export const WEATHER_AXES: WeatherAxis[] = ['precip', 'temperature', 'wind'];

export interface ControlledWeather {
  effectId: string;
  natural: Weather;
  stages: WeatherStages;
  changed: Partial<Record<WeatherAxis, boolean>>;
  pending?: { stages: WeatherStages; at: number; direction: string };
  direction?: string;
  normalAt?: number;
}

export function initialWeatherStages(weather: Weather, temperature: number): WeatherStages {
  return {
    precip: weather.precip === 'heavy' ? 4 : weather.precip === 'light' ? 3 : 0,
    temperature: temperature >= 100 ? 0 : temperature >= 85 ? 1 : temperature >= 65 ? 2 : temperature >= 45 ? 3 : temperature > 32 ? 4 : 5,
    wind: weather.wind === 'strong' ? 2 : weather.wind === 'light' ? 1 : 0,
  };
}

/** Project the spell's finer stages into the travel tracker’s weather fields. */
export function controlledForecast(control: ControlledWeather): Weather {
  const { natural, stages, changed } = control;
  const high = [105, 90, 75, 55, 40, 30][stages.temperature];
  return {
    ...natural,
    ...(changed.temperature ? { high, low: high } : {}),
    ...(changed.precip ? { precip: stages.precip === 4 ? 'heavy' : stages.precip === 3 ? 'light' : 'none' } : {}),
    ...(changed.wind ? { wind: stages.wind >= 2 ? 'strong' : stages.wind === 1 ? 'light' : 'none' } : {}),
  };
}

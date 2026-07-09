import { useState } from "react";

interface ForecastDay { day: string; tempMax: number; tempMin: number; icon: string }
interface WeatherData {
  city: string; temp: number; humidity: number; windSpeed: number; desc: string; icon: string;
  forecast: ForecastDay[]; source: "api" | "local";
}

const weatherCodes: Record<number, { desc: string; icon: string }> = {
  0: { desc: "晴朗", icon: "☀️" }, 1: { desc: "大部晴朗", icon: "🌤️" }, 2: { desc: "多云", icon: "⛅" },
  3: { desc: "阴天", icon: "☁️" }, 45: { desc: "雾", icon: "🌫️" }, 48: { desc: "霜雾", icon: "🌫️" },
  51: { desc: "毛毛雨", icon: "🌦️" }, 53: { desc: "毛毛雨", icon: "🌦️" }, 55: { desc: "毛毛雨", icon: "🌧️" },
  61: { desc: "小雨", icon: "🌧️" }, 63: { desc: "中雨", icon: "🌧️" }, 65: { desc: "大雨", icon: "🌧️" },
  71: { desc: "小雪", icon: "🌨️" }, 73: { desc: "中雪", icon: "🌨️" }, 75: { desc: "大雪", icon: "❄️" },
  77: { desc: "雪粒", icon: "❄️" }, 80: { desc: "阵雨", icon: "⛈️" }, 81: { desc: "中阵雨", icon: "⛈️" },
  82: { desc: "大阵雨", icon: "⛈️" }, 85: { desc: "小阵雪", icon: "🌨️" }, 86: { desc: "大阵雪", icon: "❄️" },
  95: { desc: "雷暴", icon: "⛈️" }, 96: { desc: "冰雹雷暴", icon: "⛈️" }, 99: { desc: "强冰雹雷暴", icon: "⛈️" },
};
function getInfo(code: number) { return weatherCodes[code] || { desc: "未知", icon: "🌤️" }; }

const cityCoords: Record<string, { lat: number; lon: number }> = {
  "北京": { lat: 39.9042, lon: 116.4074 }, "上海": { lat: 31.2304, lon: 121.4737 },
  "广州": { lat: 23.1291, lon: 113.2644 }, "深圳": { lat: 22.5431, lon: 114.0579 },
  "成都": { lat: 30.5728, lon: 104.0668 }, "杭州": { lat: 30.2741, lon: 120.1551 },
  "武汉": { lat: 30.5928, lon: 114.3055 }, "西安": { lat: 34.3416, lon: 108.9398 },
  "南京": { lat: 32.0603, lon: 118.7969 }, "重庆": { lat: 29.4316, lon: 106.9123 },
  "哈尔滨": { lat: 45.8038, lon: 126.5350 }, "昆明": { lat: 25.0389, lon: 102.7183 },
  "伦敦": { lat: 51.5074, lon: -0.1278 }, "纽约": { lat: 40.7128, lon: -74.0060 },
  "东京": { lat: 35.6762, lon: 139.6503 }, "巴黎": { lat: 48.8566, lon: 2.3522 },
  "香港": { lat: 22.3193, lon: 114.1694 }, "台北": { lat: 25.0330, lon: 121.5654 },
  "新加坡": { lat: 1.3521, lon: 103.8198 }, "悉尼": { lat: -33.8688, lon: 151.2093 },
  "首尔": { lat: 37.5665, lon: 126.9780 }, "曼谷": { lat: 13.7563, lon: 100.5018 },
  "迪拜": { lat: 25.2048, lon: 55.2708 }, "莫斯科": { lat: 55.7558, lon: 37.6173 },
  "柏林": { lat: 52.5200, lon: 13.4050 }, "罗马": { lat: 41.9028, lon: 12.4964 },
  "拉萨": { lat: 29.6500, lon: 91.1000 }, "三亚": { lat: 18.2528, lon: 109.5120 },
  "青岛": { lat: 36.0671, lon: 120.3826 }, "厦门": { lat: 24.4798, lon: 118.0894 },
  "苏州": { lat: 31.2990, lon: 120.5853 }, "天津": { lat: 39.3434, lon: 117.3616 },
};

const popularCities = Object.keys(cityCoords);

function generateLocalWeather(city: string): WeatherData {
  const hash = city.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const icons = ["☀️", "⛅", "☁️", "🌧️", "⛈️", "🌤️"];
  const descs = ["晴朗", "多云", "阴天", "小雨", "雷阵雨", "晴间多云"];
  const idx = hash % icons.length;
  const baseTemp = 10 + (hash % 25);
  return {
    city, temp: baseTemp, humidity: 30 + (hash % 50), windSpeed: 1 + (hash % 20),
    desc: descs[idx], icon: icons[idx], source: "local",
    forecast: [
      { day: "明天", tempMax: baseTemp + (hash % 6) - 2, tempMin: baseTemp - 3 + (hash % 4), icon: icons[(idx + 1) % icons.length] },
      { day: "后天", tempMax: baseTemp + (hash % 8) - 3, tempMin: baseTemp - 2 + (hash % 3), icon: icons[(idx + 2) % icons.length] },
      { day: "大后天", tempMax: baseTemp + (hash % 5), tempMin: baseTemp - 1 + (hash % 2), icon: icons[(idx + 3) % icons.length] },
    ],
  };
}

async function fetchWeather(lat: number, lon: number, cityName: string, country?: string): Promise<WeatherData> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=4`,
      { signal: ctrl.signal }
    );
    const wd = await res.json();
    const c = wd.current_weather;
    const d = wd.daily;
    const h = wd.hourly;
    const nowHour = new Date().getHours();
    const humidity = h?.relative_humidity_2m?.[nowHour] ?? Math.round(40 + Math.random() * 40);
    const info = getInfo(c.weathercode);
    return {
      city: `${cityName}${country ? ", " + country : ""}`,
      temp: Math.round(c.temperature), humidity: Math.round(humidity), windSpeed: Math.round(c.windspeed),
      desc: info.desc, icon: info.icon, source: "api",
      forecast: [
        { day: "明天", tempMax: Math.round(d.temperature_2m_max[1]), tempMin: Math.round(d.temperature_2m_min[1]), icon: getInfo(d.weathercode[1]).icon },
        { day: "后天", tempMax: Math.round(d.temperature_2m_max[2]), tempMin: Math.round(d.temperature_2m_min[2]), icon: getInfo(d.weathercode[2]).icon },
        { day: "大后天", tempMax: Math.round(d.temperature_2m_max[3]), tempMin: Math.round(d.temperature_2m_min[3]), icon: getInfo(d.weathercode[3]).icon },
      ],
    };
  } finally {
    clearTimeout(t);
  }
}

async function tryGetWeather(city: string): Promise<WeatherData> {
  // 1. 查内置坐标表 → 只发一次 API 请求
  const coord = cityCoords[city];
  if (coord) {
    return fetchWeather(coord.lat, coord.lon, city);
  }
  // 2. 不在坐标表 → geocoding + weather（两次请求）
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`,
      { signal: ctrl.signal }
    );
    const geoData = await geoRes.json();
    if (geoData.results?.length) {
      const { latitude, longitude, name: cn, country } = geoData.results[0];
      return fetchWeather(latitude, longitude, cn, country);
    }
  } catch { /* fall through */ }
  finally { clearTimeout(t); }
  throw new Error("geocoding failed");
}

function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleInput(val: string) {
    setQuery(val);
    setSuggestions(val.trim() ? popularCities.filter((c) => c.includes(val.trim())).slice(0, 8) : []);
  }

  async function searchCity(name: string) {
    const city = name.trim();
    if (!city) return;
    setQuery(city); setSuggestions([]); setFallback(false); setLoading(true);
    try {
      setWeather(await tryGetWeather(city));
    } catch {
      setWeather(generateLocalWeather(city));
      setFallback(true);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (suggestions.length > 0) searchCity(suggestions[0]);
      else if (query.trim()) searchCity(query.trim());
    }
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start p-4 pt-8 transition-colors ${weather ? (weather.temp > 30 ? "bg-gradient-to-br from-orange-50 to-red-100" : weather.temp < 15 ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-sky-50 to-emerald-100") : "bg-gradient-to-br from-sky-100 to-blue-200"}`}>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">🌤️ 天气查询</h1>
      <p className="text-gray-500 mb-2">全球 {popularCities.length}+ 城市 · 实时天气</p>

      <div className="relative w-full max-w-md mb-6">
        <div className="flex gap-2">
          <input type="text" value={query} onChange={(e) => handleInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="输入城市名，按回车查询…"
            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
          />
          <button onClick={() => searchCity(query)} disabled={!query.trim() || loading}
            className="px-5 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {loading ? "…" : "搜索"}
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
            {suggestions.map((c) => (
              <li key={c} onClick={() => searchCity(c)} className="px-5 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 text-sm">{c}</li>
            ))}
          </ul>
        )}
      </div>

      {fallback && weather && (
        <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ 网络连接不稳定</p>
          <p className="text-xs text-amber-600">无法获取实时天气数据，当前显示的是本地模拟数据，仅供参考</p>
        </div>
      )}

      {weather && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{weather.city}</h2>
              <p className="text-gray-400 text-sm">{weather.desc} {weather.source === "local" && <span className="text-amber-500 text-xs">(模拟)</span>}</p>
            </div>
            <span className="text-6xl">{weather.icon}</span>
          </div>
          <div className="text-center mb-6">
            <span className="text-6xl font-light text-gray-800">{weather.temp}°</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">湿度</p>
              <p className="text-lg font-semibold text-gray-700">{weather.humidity}%</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">风速</p>
              <p className="text-lg font-semibold text-gray-700">{weather.windSpeed} km/h</p>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">未来预报</h3>
          <div className="flex gap-3">
            {weather.forecast.map((f) => (
              <div key={f.day} className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{f.day}</p>
                <p className="text-2xl mb-1">{f.icon}</p>
                <p className="text-xs font-semibold text-gray-700">{f.tempMax}°/{f.tempMin}°</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-md mt-4">
        <p className="text-xs text-gray-400 mb-3 text-center">💡 热门城市内置坐标（单次请求），其他城市走地理编码查询</p>
        {!weather && !loading && (
          <>
            <p className="text-sm text-gray-500 mb-3 text-center">热门城市</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularCities.slice(0, 16).map((c) => (
                <button key={c} onClick={() => searchCity(c)} className="px-4 py-2 bg-white rounded-full shadow-sm text-gray-600 text-sm hover:bg-blue-50 hover:text-blue-500 transition-colors">{c}</button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;

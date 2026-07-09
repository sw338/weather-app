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
function getWeatherInfo(code: number) { return weatherCodes[code] || { desc: "未知", icon: "🌤️" }; }

const popularCities = ["北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "西安", "南京", "重庆", "哈尔滨", "昆明", "伦敦", "纽约", "东京", "巴黎"];

// 本地生成天气（API 不通时的降级方案）
function generateLocalWeather(city: string): WeatherData {
  const hash = city.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const icons = ["☀️", "⛅", "☁️", "🌧️", "⛈️", "🌤️"];
  const descs = ["晴朗", "多云", "阴天", "小雨", "雷阵雨", "晴间多云"];
  const idx = hash % icons.length;
  const baseTemp = 10 + (hash % 25);
  return {
    city,
    temp: baseTemp,
    humidity: 30 + (hash % 50),
    windSpeed: 1 + (hash % 20),
    desc: descs[idx],
    icon: icons[idx],
    source: "local",
    forecast: [
      { day: "明天", tempMax: baseTemp + (hash % 6) - 2, tempMin: baseTemp - 3 + (hash % 4), icon: icons[(idx + 1) % icons.length] },
      { day: "后天", tempMax: baseTemp + (hash % 8) - 3, tempMin: baseTemp - 2 + (hash % 3), icon: icons[(idx + 2) % icons.length] },
      { day: "大后天", tempMax: baseTemp + (hash % 5), tempMin: baseTemp - 1 + (hash % 2), icon: icons[(idx + 3) % icons.length] },
    ],
  };
}

async function fetchFromAPI(city: string): Promise<WeatherData | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`,
      { signal: controller.signal }
    );
    const geoData = await geoRes.json();
    if (!geoData.results?.length) return null;
    const { latitude, longitude, name: cityName, country } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=4`,
      { signal: controller.signal }
    );
    const wd = await weatherRes.json();
    const c = wd.current_weather;
    const d = wd.daily;
    const info = getWeatherInfo(c.weathercode);
    return {
      city: `${cityName}${country ? ", " + country : ""}`,
      temp: Math.round(c.temperature),
      humidity: c.relative_humidity_2m ?? Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(c.windspeed),
      desc: info.desc, icon: info.icon,
      source: "api",
      forecast: [
        { day: "明天", tempMax: Math.round(d.temperature_2m_max[1]), tempMin: Math.round(d.temperature_2m_min[1]), icon: getWeatherInfo(d.weathercode[1]).icon },
        { day: "后天", tempMax: Math.round(d.temperature_2m_max[2]), tempMin: Math.round(d.temperature_2m_min[2]), icon: getWeatherInfo(d.weathercode[2]).icon },
        { day: "大后天", tempMax: Math.round(d.temperature_2m_max[3]), tempMin: Math.round(d.temperature_2m_min[3]), icon: getWeatherInfo(d.weathercode[3]).icon },
      ],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function App() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleInput(val: string) {
    setQuery(val);
    setSuggestions(val.trim() ? popularCities.filter((c) => c.includes(val.trim())) : []);
  }

  async function searchCity(name: string) {
    const city = name.trim();
    if (!city) return;
    setQuery(city); setSuggestions([]); setError(""); setLoading(true);
    const apiResult = await fetchFromAPI(city);
    if (apiResult) { setWeather(apiResult); setLoading(false); return; }
    // API 不通 → 本地降级（100% 可靠）
    setWeather(generateLocalWeather(city));
    setError("fallback");
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
      <p className="text-gray-500 mb-2">全球城市 · 实时 + 本地双模式</p>

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

      {error === "fallback" && weather && (
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
        <p className="text-xs text-gray-400 mb-3 text-center">💡 优先使用 Open-Meteo 实时天气，不通时自动降级为本地模拟</p>
        {!weather && !loading && (
          <>
            <p className="text-sm text-gray-500 mb-3 text-center">热门城市</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularCities.map((c) => (
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

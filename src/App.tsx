import { useState } from "react";

interface WeatherData {
  city: string;
  temp: number;
  humidity: number;
  wind: string;
  desc: string;
  icon: string;
  forecast: { day: string; temp: number; icon: string }[];
}

const mockData: Record<string, WeatherData> = {
  "北京": { city: "北京", temp: 28, humidity: 45, wind: "北风 3级", desc: "晴朗", icon: "☀️", forecast: [{ day: "明天", temp: 30, icon: "☀️" }, { day: "后天", temp: 26, icon: "⛅" }, { day: "大后天", temp: 22, icon: "🌧️" }] },
  "上海": { city: "上海", temp: 32, humidity: 70, wind: "东南风 4级", desc: "多云", icon: "⛅", forecast: [{ day: "明天", temp: 33, icon: "☀️" }, { day: "后天", temp: 31, icon: "⛅" }, { day: "大后天", temp: 28, icon: "🌧️" }] },
  "广州": { city: "广州", temp: 35, humidity: 80, wind: "南风 2级", desc: "雷阵雨", icon: "⛈️", forecast: [{ day: "明天", temp: 34, icon: "⛈️" }, { day: "后天", temp: 33, icon: "🌧️" }, { day: "大后天", temp: 30, icon: "⛅" }] },
  "成都": { city: "成都", temp: 25, humidity: 65, wind: "微风 2级", desc: "阴天", icon: "☁️", forecast: [{ day: "明天", temp: 24, icon: "🌧️" }, { day: "后天", temp: 26, icon: "⛅" }, { day: "大后天", temp: 28, icon: "☀️" }] },
  "哈尔滨": { city: "哈尔滨", temp: 18, humidity: 40, wind: "西风 5级", desc: "小雨", icon: "🌧️", forecast: [{ day: "明天", temp: 16, icon: "🌧️" }, { day: "后天", temp: 20, icon: "⛅" }, { day: "大后天", temp: 22, icon: "☀️" }] },
};

const cities = Object.keys(mockData);

function App() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<WeatherData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleInput(val: string) {
    setQuery(val);
    if (val.trim()) {
      setSuggestions(cities.filter((c) => c.includes(val.trim())));
    } else {
      setSuggestions([]);
    }
  }

  function selectCity(name: string) {
    setQuery(name);
    setSuggestions([]);
    setSelected(mockData[name] || null);
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start p-4 pt-8 transition-colors ${selected ? (selected.temp > 30 ? "bg-gradient-to-br from-orange-50 to-red-100" : selected.temp < 20 ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-sky-50 to-emerald-100") : "bg-gradient-to-br from-sky-100 to-blue-200"}`}>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">🌤️ 天气查询</h1>
      <p className="text-gray-500 mb-8">输入城市名查看天气信息</p>

      <div className="relative w-full max-w-md mb-8">
        <input
          type="text" value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="输入城市名（如：北京、上海）"
          className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
        />
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
            {suggestions.map((c) => (
              <li key={c} onClick={() => selectCity(c)} className="px-5 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 text-sm transition-colors">{c}</li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{selected.city}</h2>
              <p className="text-gray-400 text-sm">{selected.desc}</p>
            </div>
            <span className="text-6xl">{selected.icon}</span>
          </div>
          <div className="text-center mb-6">
            <span className="text-6xl font-light text-gray-800">{selected.temp}°</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">湿度</p>
              <p className="text-lg font-semibold text-gray-700">{selected.humidity}%</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400">风力</p>
              <p className="text-lg font-semibold text-gray-700">{selected.wind}</p>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3">未来预报</h3>
          <div className="flex gap-3">
            {selected.forecast.map((f) => (
              <div key={f.day} className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{f.day}</p>
                <p className="text-2xl mb-1">{f.icon}</p>
                <p className="text-sm font-semibold text-gray-700">{f.temp}°</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!selected && (
        <div className="w-full max-w-md">
          <p className="text-sm text-gray-500 mb-3 text-center">热门城市</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {cities.map((c) => (
              <button key={c} onClick={() => selectCity(c)} className="px-4 py-2 bg-white rounded-full shadow-sm text-gray-600 text-sm hover:bg-blue-50 hover:text-blue-500 transition-colors">{c}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

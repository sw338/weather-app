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

// 用城市名生成模拟天气（同一城市始终一致）
function generateWeather(city: string): WeatherData {
  const hash = city.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const baseTemp = 15 + (hash % 25);
  const icons = ["☀️", "⛅", "☁️", "🌧️", "⛈️", "🌤️"];
  const descs = ["晴朗", "多云", "阴天", "小雨", "雷阵雨", "晴间多云"];
  const winds = ["北风", "南风", "东风", "西风", "东南风", "西北风", "东北风", "西南风"];
  const idx = hash % icons.length;

  return {
    city,
    temp: baseTemp,
    humidity: 30 + (hash % 55),
    wind: `${winds[hash % winds.length]} ${1 + (hash % 5)}级`,
    desc: descs[idx],
    icon: icons[idx],
    forecast: [
      { day: "明天", temp: baseTemp + (hash % 5) - 2, icon: icons[(idx + 1) % icons.length] },
      { day: "后天", temp: baseTemp + (hash % 7) - 3, icon: icons[(idx + 2) % icons.length] },
      { day: "大后天", temp: baseTemp + (hash % 4) - 1, icon: icons[(idx + 3) % icons.length] },
    ],
  };
}

const popularCities = ["北京", "上海", "广州", "深圳", "成都", "杭州", "武汉", "西安", "南京", "重庆", "哈尔滨", "昆明"];

function App() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<WeatherData | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  function handleInput(val: string) {
    setQuery(val);
    if (val.trim()) {
      setSuggestions(popularCities.filter((c) => c.includes(val.trim())));
    } else {
      setSuggestions([]);
    }
  }

  function searchCity(name: string) {
    const city = name.trim();
    if (!city) return;
    setQuery(city);
    setSuggestions([]);
    setSelected(generateWeather(city));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
        searchCity(suggestions[0]);
      } else if (query.trim()) {
        searchCity(query.trim());
      }
    }
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-start p-4 pt-8 transition-colors ${selected ? (selected.temp > 30 ? "bg-gradient-to-br from-orange-50 to-red-100" : selected.temp < 20 ? "bg-gradient-to-br from-blue-50 to-indigo-100" : "bg-gradient-to-br from-sky-50 to-emerald-100") : "bg-gradient-to-br from-sky-100 to-blue-200"}`}>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">🌤️ 天气查询</h1>
      <p className="text-gray-500 mb-2">输入任意城市名，按回车查询</p>

      <div className="relative w-full max-w-md mb-8">
        <div className="flex gap-2">
          <input
            type="text" value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入城市名，按回车查询…"
            className="flex-1 px-5 py-3 rounded-xl border border-gray-200 bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-700"
          />
          <button onClick={() => searchCity(query)} disabled={!query.trim()}
            className="px-5 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors">
            搜索
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
            {suggestions.map((c) => (
              <li key={c} onClick={() => searchCity(c)} className="px-5 py-2.5 hover:bg-blue-50 cursor-pointer text-gray-700 text-sm transition-colors">{c}</li>
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

      <div className="w-full max-w-md mt-4">
        <p className="text-xs text-gray-400 mb-3 text-center">💡 提示：输入城市名后按回车键或点搜索按钮即可查询。支持任意城市（如 三亚、拉萨、纽约…）</p>
        {!selected && (
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

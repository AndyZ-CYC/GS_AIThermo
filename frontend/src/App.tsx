import { Routes, Route, Link, useLocation } from "react-router-dom";
import MatrixOverview from "./pages/MatrixOverview";
import GameTypeManagement from "./pages/GameTypeManagement";
import RoleManagement from "./pages/RoleManagement";

const navItems = [
  { path: "/", label: "矩阵总览" },
  { path: "/game-types", label: "游戏类型管理" },
  { path: "/roles", label: "工种管理" },
];

export default function App() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 flex items-center h-14 gap-6">
          <span className="font-bold text-lg text-gray-800 mr-4">AI 行业温度计</span>
          {navItems.map((n) => (
            <Link
              key={n.path}
              to={n.path}
              className={`text-sm px-3 py-1.5 rounded-md transition-colors ${
                location.pathname === n.path
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <main className="max-w-[1600px] mx-auto p-4">
        <Routes>
          <Route path="/" element={<MatrixOverview />} />
          <Route path="/game-types" element={<GameTypeManagement />} />
          <Route path="/roles" element={<RoleManagement />} />
        </Routes>
      </main>
    </div>
  );
}

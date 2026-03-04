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
    <div className="min-h-screen">
      <nav className="border-b border-border bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 flex items-center h-14 gap-8">
          <span className="font-semibold text-lg text-text-primary tracking-wide mr-2">
            AI 行业温度计
          </span>
          {navItems.map((n) => {
            const active = location.pathname === n.path;
            return (
              <Link
                key={n.path}
                to={n.path}
                className={`relative text-sm tracking-wider py-4 transition-colors duration-200 ${
                  active
                    ? "text-text-primary font-medium"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {n.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="max-w-[1600px] mx-auto p-6">
        <Routes>
          <Route path="/" element={<MatrixOverview />} />
          <Route path="/game-types" element={<GameTypeManagement />} />
          <Route path="/roles" element={<RoleManagement />} />
        </Routes>
      </main>
    </div>
  );
}

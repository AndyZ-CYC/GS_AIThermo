import { useState } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import MatrixOverview from "./pages/MatrixOverview";
import DataManagement from "./pages/DataManagement";

const navItems = [
  { path: "/", label: "矩阵总览" },
  { path: "/manage", label: "数据管理" },
];

export default function App() {
  const location = useLocation();
  const [isWideMode, setIsWideMode] = useState(false);

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border bg-bg-surface/80 backdrop-blur-sm sticky top-0 z-40">
        <div className={`mx-auto px-6 flex items-center h-14 gap-8 transition-all duration-300 ${location.pathname === "/" && isWideMode ? 'max-w-none' : 'max-w-[1600px]'}`}>
          <span className="font-semibold text-lg text-text-primary tracking-wide mr-2">
            AI 行业温度计
          </span>
          {navItems.map((n) => {
            const active = location.pathname === n.path;
            return (
              <Link
                key={n.path}
                to={n.path}
                className={`relative text-base tracking-wider py-4 transition-colors duration-200 ${active
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
          {location.pathname === "/" && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-text-secondary">宽屏模式</span>
              <button
                onClick={() => setIsWideMode(!isWideMode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isWideMode ? 'bg-accent' : 'bg-bg-elevated/80 border border-border'}`}
              >
                <span className="sr-only">Toggle wide mode</span>
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isWideMode ? 'translate-x-2' : '-translate-x-2'}`}
                />
              </button>
            </div>
          )}
        </div>
      </nav>
      <main className={`mx-auto p-6 transition-all duration-300 ${location.pathname === "/" && isWideMode ? 'max-w-none px-4' : 'max-w-[1600px] px-6'}`}>
        <div key={location.pathname} className="animate-page-in">
          <Routes>
            <Route path="/" element={<MatrixOverview />} />
            <Route path="/manage" element={<DataManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

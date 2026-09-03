import { NavLink, Outlet } from "react-router-dom";
import "./Layout.css";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/exam/new", label: "Prüfung starten", icon: "▶" },
  { to: "/weaknesses", label: "Schwächen", icon: "◔" },
  { to: "/statistics", label: "Statistik", icon: "▤" },
  { to: "/questions", label: "Fragenkatalog", icon: "▦" },
  { to: "/settings", label: "Einstellungen", icon: "⚙" },
];

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-dot" />
          <div>
            <div className="brand-title">CCNA EXAM SIM</div>
            <div className="brand-sub">local · offline · private</div>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot good" /> alle Daten lokal · keine Cloud
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

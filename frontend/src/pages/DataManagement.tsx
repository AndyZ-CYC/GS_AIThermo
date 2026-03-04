import GameTypeManagement from "./GameTypeManagement";
import RoleManagement from "./RoleManagement";

export default function DataManagement() {
  return (
    <div className="grid grid-cols-2 gap-6 items-start">
      <GameTypeManagement />
      <RoleManagement />
    </div>
  );
}

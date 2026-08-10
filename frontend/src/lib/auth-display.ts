export function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

export function getRoleLabel(role?: string): string {
  if (role === "admin") return "Administrator";
  if (role === "vendor") return "Venue Owner";
  if (role === "customer") return "Customer";
  return "User";
}

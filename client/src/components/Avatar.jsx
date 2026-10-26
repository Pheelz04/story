export default function Avatar({ user, size = 28 }) {
  if (!user) return null;
  const hue = user.avatarHue ?? 265;
  const initials = user.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${hue} 80% 62%), hsl(${(hue + 50) % 360} 85% 52%))`
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

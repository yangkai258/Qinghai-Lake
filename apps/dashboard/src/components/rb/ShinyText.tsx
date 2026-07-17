/**
 * ShinyText — text with a diagonal sweep highlight looping.
 * Static render (server component OK) so it works in the SSR/TV path.
 */
export function ShinyText({ children, baseColor = "#94b3d9", shineColor = "#ffffff" }: {
  children: React.ReactNode;
  baseColor?: string;
  shineColor?: string;
}) {
  const id = "rb-shine-" + Math.random().toString(36).slice(2, 8);
  return (
    <span
      style={{
        display: "inline-block",
        background: `linear-gradient(90deg, ${baseColor} 0%, ${baseColor} 35%, ${shineColor} 50%, ${baseColor} 65%, ${baseColor} 100%)`,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        animation: `rb-shine ${id} 4s linear infinite`,
      }}
    >
      {children}
      <style>{`@keyframes rb-shine-${id} { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </span>
  );
}
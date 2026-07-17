export function GradientText({
  children,
  colors = ["#3aa0ff", "#66e6c1", "#3aa0ff"],
  className,
}: {
  children: React.ReactNode;
  colors?: string[];
  className?: string;
}) {
  const grad = `linear-gradient(90deg, ${colors.join(", ")})`;
  return (
    <span
      className={className}
      style={{
        background: grad,
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        animation: "rb-grad-shift 6s linear infinite",
      }}
    >
      {children}
      <style>{`@keyframes rb-grad-shift { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }`}</style>
    </span>
  );
}
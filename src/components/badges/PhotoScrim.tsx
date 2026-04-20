/**
 * Gradient scrim — dark overlay on top and bottom of vehicle photos.
 * Guarantees overlay legibility regardless of photo subject (white car,
 * black car, cluttered lot background).
 */

export default function PhotoScrim() {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 65%, rgba(0,0,0,0.55) 100%)",
      }}
      aria-hidden="true"
    />
  );
}

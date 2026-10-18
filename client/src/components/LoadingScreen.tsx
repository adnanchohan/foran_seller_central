export function LoadingScreen({ label = 'Loading your account…' }: { label?: string }) {
  return (
    <div className="loading-screen" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

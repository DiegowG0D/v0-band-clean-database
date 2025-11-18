export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-blue-200" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

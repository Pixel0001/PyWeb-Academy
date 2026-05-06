export default function ProfilLoading() {
  return (
    <div className="min-h-screen bg-slate-100 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Back button */}
        <div className="h-9 w-32 bg-slate-200 rounded-xl" />

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-4 w-32 bg-slate-100 rounded" />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
              <div className="h-4 w-20 bg-slate-200 rounded" />
              <div className="h-8 w-12 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Main cards */}
        <div className="h-64 bg-white rounded-2xl shadow-sm" />
        <div className="h-48 bg-white rounded-2xl shadow-sm" />
        <div className="h-56 bg-white rounded-2xl shadow-sm" />
      </div>
    </div>
  )
}

import { writeFileSync } from 'fs'

const file = 'app/curs/[slug]/page.js'
const idx = current.indexOf('export default function CourseDetailPage()')
const header = current.substring(0, idx)

const newMain = `export default function CourseDetailPage() {
  const params = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }) }, [])

  useEffect(() => {
    if (!params.slug) return
    const fetchCourse = async () => {
      try {
        const res = await fetch(\`/api/public/courses/\${params.slug}\`)
        if (!res.ok) { setError(res.status === 404 ? 'Cursul nu a fost găsit' : 'Eroare la încărcare'); return }
        setCourse(await res.json())
      } catch { setError('A apărut o eroare la încărcarea cursului') }
      finally { setLoading(false) }
    }
    fetchCourse()
  }, [params.slug])

  const images = course?.images?.length > 0
    ? course.images
    : (course?.mainImageUrl || course?.imageUrl ? [course.mainImageUrl || course.imageUrl] : [])

  const nextImage = useCallback(() => setCurrentImageIndex(p => (p + 1) % images.length), [images.length])
  const prevImage = useCallback(() => setCurrentImageIndex(p => (p - 1 + images.length) % images.length), [images.length])

  useEffect(() => {
    if (!isAutoPlaying || images.length <= 1 || isLightboxOpen) return
    const t = setInterval(nextImage, 4000)
    return () => clearInterval(t)
  }, [isAutoPlaying, images.length, isLightboxOpen, nextImage])

  useEffect(() => {
    const handler = (e) => {
      if (!isLightboxOpen) return
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
      if (e.key === 'Escape') setIsLightboxOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isLightboxOpen, nextImage, prevImage])

  const levelKey = course?.level?.toLowerCase()
  const levelColor = LEVEL_COLORS[levelKey] || '#3b82f6'
  const ageText = course?.ageMin ? \`\${course.ageMin}\${course.ageMax ? \`–\${course.ageMax}\` : '+'} ani\` : null
  const hasDiscount = course?.discountPrice != null && course.discountPrice < course?.price
  const discountPct = hasDiscount ? Math.round((1 - course.discountPrice / course.price) * 100) : 0
  const isFree = course?.price === 0 && !hasDiscount

  if (loading) return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', paddingTop: '5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{ height: 320, backgroundColor: 'var(--border-light)', borderRadius: '1rem', marginBottom: '1rem', opacity: 0.6 }} />
          <div style={{ height: 24, width: 200, backgroundColor: 'var(--border-light)', borderRadius: '0.5rem', opacity: 0.6 }} />
        </div>
      </main>
      <Footer />
    </>
  )

  if (error) return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', paddingTop: '5rem' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '1rem' }}>{error}</h1>
          <a href="/#cursuri" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
            ← Înapoi la cursuri
          </a>
        </div>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>

        {/* HERO */}
        <div style={{ position: 'relative', height: '52vh', minHeight: 300, overflow: 'hidden', marginTop: 64 }}>
          {images.length > 0 ? (
            <>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'absolute', inset: 0, transition: 'opacity 0.6s', opacity: currentImageIndex === idx ? 1 : 0 }}>
                  <img src={img} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 35%, var(--bg-page) 100%)' }} />
            </>
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--bg-section-alt) 0%, var(--bg-page) 100%)' }} />
          )}

          <a href="/#cursuri" style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: 9999, textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            ← Înapoi
          </a>

          {images.length > 0 && (
            <button onClick={() => setIsLightboxOpen(true)} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10, width: 40, height: 40, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
              <IconExpand />
            </button>
          )}

          {images.length > 1 && (
            <>
              <button onClick={() => { setIsAutoPlaying(false); prevImage() }} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.88)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontSize: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                ‹
              </button>
              <button onClick={() => { setIsAutoPlaying(false); nextImage() }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.88)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontSize: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}>
                ›
              </button>
              <div style={{ position: 'absolute', bottom: '4.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '0.4rem' }}>
                {images.map((_, idx) => (
                  <button key={idx} onClick={() => { setCurrentImageIndex(idx); setIsAutoPlaying(false) }} style={{ width: currentImageIndex === idx ? 24 : 8, height: 8, borderRadius: 9999, backgroundColor: currentImageIndex === idx ? '#fff' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* CONTENT */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>

            {/* LEFT */}
            <div>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', padding: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  {course.level && <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', backgroundColor: levelColor, padding: '0.3rem 0.875rem', borderRadius: 9999 }}>{course.level}</span>}
                  {course.category && <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary)', backgroundColor: 'var(--color-accent-light)', padding: '0.3rem 0.875rem', borderRadius: 9999 }}>{course.category}</span>}
                </div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--text-heading)', lineHeight: 1.15, marginBottom: '0.875rem' }}>{course.title}</h1>
                {course.descriptionShort && <p style={{ fontSize: '1rem', color: 'var(--text-body)', lineHeight: 1.75, marginBottom: '1.5rem' }}>{course.descriptionShort}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
                  {ageText && <Chip icon={<IconUsers />} text={ageText} />}
                  {course.duration && <Chip icon={<IconClock />} text={course.duration} />}
                  {course.lessonsCount > 0 && <Chip icon={<IconBook />} text={\`\${course.lessonsCount} lecții\`} />}
                  {course.seatsTotal > 0 && <Chip icon={<IconGraduate />} text={\`max \${course.seatsTotal} elevi\`} />}
                </div>
              </div>

              {course.descriptionLong && (
                <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', padding: '2rem', marginBottom: '1.5rem' }}>
                  <SectionTitle icon={<span>ℹ</span>} title="Despre acest curs" />
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-body)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{course.descriptionLong}</p>
                </div>
              )}

              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', padding: '2rem', marginBottom: '1.5rem' }}>
                <SectionTitle icon={<IconCheck />} title="Ce primești" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {['Prima lecție gratuită','Suport personalizat','Certificat de absolvire','Grupe mici (max 10)','Proiecte practice reale','Acces la toate materialele'].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-body)' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#16a34a' }}><IconCheck /></span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {images.length > 1 && (
                <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-card)', padding: '2rem' }}>
                  <SectionTitle icon={<span>📷</span>} title="Galerie" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.625rem' }}>
                    {images.map((img, idx) => (
                      <button key={idx} onClick={() => { setCurrentImageIndex(idx); setIsLightboxOpen(true) }} style={{ position: 'relative', aspectRatio: '1', borderRadius: '0.75rem', overflow: 'hidden', cursor: 'pointer', border: \`2.5px solid \${currentImageIndex === idx ? 'var(--color-primary)' : 'transparent'}\`, opacity: currentImageIndex === idx ? 1 : 0.6, transition: 'all 0.2s', padding: 0, background: 'none' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SIDEBAR */}
            <div style={{ position: 'sticky', top: '5.5rem' }}>
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', boxShadow: '0 8px 40px rgba(30,58,138,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.75rem', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Preț curs</p>
                  {isFree ? (
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: '#16a34a' }}>Gratuit</span>
                  ) : hasDiscount ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{course.price} lei/lună</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fff', backgroundColor: '#dc2626', padding: '0.18rem 0.45rem', borderRadius: '0.35rem' }}>-{discountPct}%</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>{course.discountPrice}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>lei/lună</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem' }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>{course.price}</span>
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>lei/lună</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a href="/inscriere" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.9rem', backgroundColor: 'var(--color-accent)', color: '#0f172a', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', borderRadius: '0.875rem', textDecoration: 'none', boxShadow: '0 4px 18px rgba(245,158,11,0.35)' }}>
                    Înscrie-te acum
                  </a>
                  <a href="/#contact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', backgroundColor: 'transparent', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', borderRadius: '0.875rem', textDecoration: 'none', border: '1.5px solid var(--border-light)' }}>
                    Solicită lecție gratuită
                  </a>
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                    {['Prima lecție gratuită','Certificat de absolvire','Grupe mici, max 10 elevi','Materiale incluse'].map(text => (
                      <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.835rem', color: 'var(--text-body)' }}>
                        <span style={{ color: 'var(--color-primary)', flexShrink: 0 }}><IconCheck /></span>
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isLightboxOpen && images.length > 0 && (
        <div onClick={() => setIsLightboxOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setIsLightboxOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', width: 44, height: 44, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
            ×
          </button>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '90vw', height: '80vh', maxWidth: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={images[currentImageIndex]} alt={course.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '0.5rem' }} />
          </div>
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevImage() }} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                ‹
              </button>
              <button onClick={e => { e.stopPropagation(); nextImage() }} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                ›
              </button>
              <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', padding: '0.375rem 0.875rem', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, color: '#fff', fontSize: '0.875rem' }}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}

      <Footer />
    </>
  )
}
`

writeFileSync(file, header + newMain, 'utf8')
console.log('Done! Written', (header + newMain).length, 'chars')

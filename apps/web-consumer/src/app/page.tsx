import Link from 'next/link';
import { Button, Card, TrustShield } from '@pet-central/ui';
import { HeroSearch } from '@/components/HeroSearch';
import { AnimateOnScroll, CountUp } from '@/components/AnimateOnScroll';

const PET_CATEGORIES = [
  { label: 'Dogs', href: '/search?petType=dog', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80', count: '5,200+' },
  { label: 'Cats', href: '/search?petType=cat', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80', count: '3,800+' },
  { label: 'Birds', href: '/search?petType=bird', image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80', count: '1,400+' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search & Discover', desc: 'Browse thousands of pets from verified breeders, shelters, and rescue organizations near you.', color: 'bg-brand-50 text-brand-600' },
  { step: '02', title: 'Connect Safely', desc: 'Message sources directly through our moderated platform. Ask questions, schedule visits, and learn more.', color: 'bg-blue-50 text-blue-600' },
  { step: '03', title: 'Welcome Home', desc: 'Complete the adoption or purchase process with confidence, backed by verified reviews and trust badges.', color: 'bg-purple-50 text-purple-600' },
];

const FEATURED_PETS = [
  { name: 'Buddy', breed: 'Golden Retriever', age: '2 yrs', loc: 'Portland, OR', price: '$800', type: 'breeder', img: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=500&q=80' },
  { name: 'Luna', breed: 'Maine Coon', age: '1 yr', loc: 'Austin, TX', price: 'Adopt', type: 'shelter', img: 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=500&q=80' },
  { name: 'Charlie', breed: 'Cockatiel', age: '6 mo', loc: 'Denver, CO', price: '$150', type: 'breeder', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=500&q=80' },
  { name: 'Daisy', breed: 'Labrador', age: '3 yrs', loc: 'Seattle, WA', price: 'Adopt', type: 'rescue', img: 'https://images.unsplash.com/photo-1591160690555-5debfba0c36a?w=500&q=80' },
];

const TRUST_FEATURES = [
  { icon: ShieldCheckIcon, title: 'Verified Sources', desc: 'Every organization undergoes identity and credential verification before they can list.' },
  { icon: StarIcon, title: 'Real Reviews', desc: 'Only verified interactions can generate reviews. No fake ratings, no manipulation.' },
  { icon: LockIcon, title: 'Safe Messaging', desc: 'AI-moderated messaging with spam detection keeps every conversation safe and productive.' },
  { icon: SparklesIcon, title: 'AI Guidance', desc: 'Get personalized breed recommendations and adoption advice from our AI assistant.' },
];

const TESTIMONIALS = [
  { name: 'Sarah M.', location: 'Portland, OR', pet: 'Adopted Max, a Golden Retriever', text: 'PetCentral made finding our perfect dog so easy. The verified badges gave us real confidence in the shelter we worked with.', rating: 5 },
  { name: 'James K.', location: 'Austin, TX', pet: 'Purchased Milo, a Maine Coon', text: 'The breeder verification process is excellent. We knew exactly what we were getting into. Milo is now our best friend!', rating: 5 },
  { name: 'Emily R.', location: 'Denver, CO', pet: 'Adopted Kiwi, a Cockatiel', text: 'The AI assistant helped us understand what bird breed would work best for our apartment. Kiwi is a perfect fit!', rating: 5 },
];

const STATS = [
  { value: 2500, suffix: '+', label: 'Trusted Organizations' },
  { value: 15000, suffix: '+', label: 'Happy Families' },
  { value: 48, suffix: '/5', prefix: '', label: 'Average Rating', displayValue: '4.8/5' },
  { value: 98, suffix: '%', label: 'Response Rate' },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-brand-50/80 via-white to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-100/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-purple-100/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
              <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse-soft" />
              Trusted by 15,000+ families
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Find your perfect companion from{' '}
              <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent">
                trusted sources
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500">
              Connect with verified breeders, trusted shelters, and rescue organizations.
              Every pet deserves a loving home, and every family deserves a trusted source.
            </p>
            <div className="mt-10">
              <HeroSearch />
            </div>
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Browse by pet type</h2>
            <p className="mt-3 text-gray-500">Thousands of pets from verified sources, waiting for their forever home.</p>
          </div>
        </AnimateOnScroll>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {PET_CATEGORIES.map((cat, i) => (
            <AnimateOnScroll key={cat.label} delay={i * 100}>
              <Link href={cat.href} className="group block">
                <div className="relative overflow-hidden rounded-card">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={cat.image} alt={cat.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white">{cat.label}</h3>
                    <p className="mt-1 text-sm text-white/80">{cat.count} listings</p>
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur-sm">
                    Explore &rarr;
                  </div>
                </div>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-gray-50/80 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">How PetCentral works</h2>
              <p className="mt-3 text-gray-500">Finding your perfect pet in three simple steps.</p>
            </div>
          </AnimateOnScroll>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => (
              <AnimateOnScroll key={item.step} delay={i * 120}>
                <div className="relative rounded-card bg-white p-8 shadow-card transition-all hover:shadow-card-hover">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${item.color}`}>
                    {item.step}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Pets */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Featured pets</h2>
              <p className="mt-2 text-gray-500">Hand-picked from our most trusted sources.</p>
            </div>
            <Link href="/search" className="hidden items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 sm:flex">
              View all <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        </AnimateOnScroll>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PETS.map((pet, i) => (
            <AnimateOnScroll key={pet.name} delay={i * 80}>
              <Link href="/search" className="group block">
                <Card padding="none" hover className="overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={pet.img} alt={pet.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-400 shadow-sm backdrop-blur-sm transition-all hover:text-red-500 hover:shadow-md" aria-label="Save to favorites">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    </button>
                    {pet.type !== 'breeder' && (
                      <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                        {pet.type === 'shelter' ? 'Shelter' : 'Rescue'}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{pet.name}</h3>
                      <span className="text-sm font-bold text-brand-700">{pet.price}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{pet.breed} &middot; {pet.age}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" /></svg>
                      {pet.loc}
                    </div>
                    <div className="mt-3">
                      <TrustShield level="verified" size="sm" />
                    </div>
                  </div>
                </Card>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/search"><Button variant="outline">View all pets</Button></Link>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-gradient-to-b from-gray-50/50 to-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Why families trust PetCentral</h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-500">
                We go the extra mile to ensure every organization on our platform meets the highest standards of care and transparency.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_FEATURES.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 100}>
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-sm">
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-white py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-extrabold text-brand-600 sm:text-4xl">
                {stat.displayValue ? (
                  stat.displayValue
                ) : (
                  <CountUp end={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">What our families say</h2>
            <p className="mt-3 text-gray-500">Real stories from people who found their perfect pet.</p>
          </div>
        </AnimateOnScroll>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <AnimateOnScroll key={t.name} delay={i * 100}>
              <Card variant="elevated" className="relative">
                <div className="absolute -top-3 left-6 text-5xl text-brand-200">&ldquo;</div>
                <div className="relative pt-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <svg key={j} className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.176 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.28-3.957z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600">{t.text}</p>
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location} &middot; {t.pet}</p>
                  </div>
                </div>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 py-20">
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to find your new best friend?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-brand-100">
            Join thousands of families who found their perfect pet through PetCentral&apos;s trusted marketplace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/search">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-gray-50 shadow-lg">
                Browse Pets
              </Button>
            </Link>
            <Link href="/ai-assistant">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

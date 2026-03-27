'use client';

import Link from 'next/link';

const FOOTER_SECTIONS = [
  {
    title: 'About',
    links: [
      { label: 'About PetCentral', href: '#' },
      { label: 'How It Works', href: '#' },
      { label: 'Our Mission', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Press', href: '#' },
    ],
  },
  {
    title: 'For Pet Seekers',
    links: [
      { label: 'Find a Pet', href: '/search' },
      { label: 'AI Pet Guide', href: '/ai-assistant' },
      { label: 'Adoption Tips', href: '/resources' },
      { label: 'Breed Guides', href: '/resources' },
      { label: 'My Favorites', href: '/favorites' },
    ],
  },
  {
    title: 'For Organizations',
    links: [
      { label: 'List Your Pets', href: '#' },
      { label: 'Vendor Portal', href: '#' },
      { label: 'Verification Process', href: '#' },
      { label: 'Partner Program', href: '#' },
      { label: 'Pricing', href: '#' },
    ],
  },
  {
    title: 'Trust & Safety',
    links: [
      { label: 'Trust Center', href: '#' },
      { label: 'Report an Issue', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  },
];

const SOCIAL_LINKS = [
  { label: 'Facebook', icon: FacebookIcon, href: '#' },
  { label: 'Twitter', icon: TwitterIcon, href: '#' },
  { label: 'Instagram', icon: InstagramIcon, href: '#' },
  { label: 'YouTube', icon: YouTubeIcon, href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      {/* Newsletter banner */}
      <div className="border-b border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Stay in the loop</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get pet care tips, new listings alerts, and platform updates.
            </p>
          </div>
          <form className="flex w-full max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-button border border-gray-300 bg-white px-4 py-2.5 text-sm placeholder-gray-400 transition-all focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              className="shrink-0 rounded-button bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand-700 active:scale-[0.98]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                <svg className="h-4.5 w-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.5 11.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 .55-.18 1.06-.5 1.47L6.5 16l-2-3.03c-.32-.41-.5-.92-.5-1.47zM14.5 11.5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5c0 .55-.18 1.06-.5 1.47L17 16l-2-3.03c-.32-.41-.5-.92-.5-1.47zM12 6c-1.38 0-2.5 1.12-2.5 2.5 0 .55.18 1.06.5 1.47L12 13l2-3.03c.32-.41.5-.92.5-1.47C14.5 7.12 13.38 6 12 6zM12 16c-1.1 0-2 .9-2 2v2h4v-2c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">
                Pet<span className="text-brand-600">Central</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              The trusted marketplace connecting pet seekers with verified breeders, shelters, and rescue organizations.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all hover:bg-brand-50 hover:text-brand-600"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-brand-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} PetCentral. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5 text-trust-verified" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.403 12.652a3 3 0 010-5.304 3 3 0 00-1.065-3.588 3 3 0 00-3.753-1.065 3 3 0 00-5.304 0 3 3 0 00-3.588 1.065 3 3 0 00-1.065 3.753 3 3 0 000 5.304 3 3 0 001.065 3.588 3 3 0 003.753 1.065 3 3 0 005.304 0 3 3 0 003.588-1.065 3 3 0 001.065-3.753z" clipRule="evenodd" />
              </svg>
              All organizations verified
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <svg className="h-3.5 w-3.5 text-trust-info" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Secure messaging
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

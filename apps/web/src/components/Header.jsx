import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        {/* Relative container ile logoyu merkeze, butonu sağa sabitliyoruz */}
        <div className="relative flex items-center justify-center min-h-[32px]">

          {/* Logo - Tam Merkezde */}
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-[0.15em] uppercase text-foreground drop-shadow-sm">
            ATLAS
          </h1>

          {/* Google Butonu - Sağ Tarafa Hizalı */}
          <a
            href="https://share.google/gx9QBu5N87yWGipUd"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-0 flex items-center gap-1 group text-amber-500 hover:text-amber-600 transition-colors duration-300"
            title="Bizi Google'da Değerlendirin!"
          >
            {/* İçi Dolu Yıldız Puanı daha iyi vurgular */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 transition-transform group-hover:scale-110 duration-300"
            >
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium font-sans text-muted-foreground group-hover:text-amber-600 transition-colors">
              4.9
            </span>
          </a>

        </div>
      </div>
    </header>
  );
};

export default Header;

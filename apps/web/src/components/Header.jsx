import React from 'react';

const Header = () => {
  return (
    <header className="w-full bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Ortalamak ve öğeleri dikey hizalamak için flex */}
        <div className="flex items-center justify-center gap-2">

          {/* Sofistike Font Tasarımı */}
          <h1 className="text-xl sm:text-2xl font-serif font-bold tracking-[0.15em] uppercase text-foreground drop-shadow-sm transition-all duration-300">
            Good Food... Good Mood...
          </h1>

          {/* Zarif Google Değerlendirme Butonu */}
          <a
            href="https://share.google/gx9QBu5N87yWGipUd"
            target="_blank"
            rel="noopener noreferrer"
            // flex items-center ve gap-1 ile yıldız ve puanı yan yana getirdik
            className="flex items-center gap-1 group text-amber-500 hover:text-amber-600 transition-colors duration-300 cursor-pointer"
            title="Bizi Google'da Değerlendirin!"
          >
            {/* İçi Boş (Outline) Minimalist Yıldız */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none" // İçini boş bıraktık
              viewBox="0 0 24 24"
              strokeWidth={1.5} // İnce çizgi
              stroke="currentColor" // Rengi 'amber-500'den alır
              className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110 duration-300"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>

            {/* Minimalist Puan Detayı - Tasarımı bütünleştirir */}
            <span className="text-xs sm:text-sm font-sans text-muted-foreground/80 group-hover:text-amber-600 transition-colors duration-300 mt-0.5">
              (4.9)
            </span>
          </a>

        </div>
      </div>
    </header>
  );
};

export default Header;

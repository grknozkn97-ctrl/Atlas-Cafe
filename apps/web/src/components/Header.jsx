import React from 'react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        {/* Ana Taşıyıcı: Logo ve Metinleri ortalar */}
        <div className="flex flex-col items-center justify-center">
          
          {/* Logo ve Marka Grubu */}
          <div className="flex items-center gap-3 mb-1">
            {/* LOGO BURAYA: src kısmına logonu ekleyebilirsin */}
            <img 
              src="/logo.png" // public klasöründeki logo dosyanın adı
              alt="Atlas Cafe Logo" 
              className="w-10 h-10 object-contain" // Boyutu buradan ayarlayabilirsin
              onError={(e) => e.target.style.display = 'none'} // Logo yoksa alanı gizler
            />
            
            <h1 className="text-2xl font-serif font-bold tracking-[0.2em] uppercase text-foreground">
              ATLAS
            </h1>
          </div>

          {/* Alt Bilgi: Google Puanı ve Metin */}
          <a
            href="https://share.google/gx9QBu5N87yWGipUd"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 group"
          >
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-3 h-3 ${i < 4 ? 'text-amber-500' : 'text-amber-500/50'}`}
                >
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium group-hover:text-amber-600 transition-colors">
              4.9 • Rating for Google
            </span>
          </a>

        </div>
      </div>
    </header>
  );
};

export default Header;

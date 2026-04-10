
import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background mt-auto border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Brand */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-background">Atlas Cafe</h3>
        </div>

        {/* Contact Information */}
        <div className="mb-12 space-y-2">
          <p className="text-background/80 text-sm">
            Email: info@atlascafe.com
          </p>
          <p className="text-background/80 text-sm">
            Phone: +1 (555) 123-4567
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-background/20 pt-8">
          <p className="text-background/70 text-sm">
            &copy; {currentYear} Atlas Cafe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

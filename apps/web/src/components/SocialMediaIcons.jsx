import React from 'react';
import { Instagram, Mail, Phone, Globe } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const SocialMediaIcons = () => {
  const icons = [
    {
      id: 'instagram',
      label: 'Instagram',
      icon: Instagram,
      href: 'https://www.instagram.com/atlascafefoodbar/',
      ariaLabel: 'Follow us on Instagram'
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      href: 'mailto:cafeatlas934@gmail.com',
      ariaLabel: 'Send us an email'
    },
    {
      id: 'phone',
      label: 'Phone',
      icon: Phone,
      href: 'tel:+38267036687',
      ariaLabel: 'Call us'
    },
    {
      id: 'google',
      label: 'Google',
      icon: Globe,
      href: 'https://share.google/Z1KLspXt9AskPmgMV',
      ariaLabel: 'Review us on Google'
    }
  ];

  return (
    <div className="relative z-10 flex flex-wrap justify-center items-center gap-6 sm:gap-8 opacity-100 visible">
      {icons.map((item) => {
        const IconComponent = item.icon;
        return (
          <a
            key={item.id}
            href={item.href}
            aria-label={item.ariaLabel}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center",
              "rounded-2xl",
              "bg-card hover:bg-primary",
              "text-card-foreground hover:text-primary-foreground",
              "border border-border/50 hover:border-primary",
              "shadow-sm hover:shadow-lg",
              "transition-all duration-300 ease-out",
              "hover:-translate-y-1 hover:scale-105",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "group"
            )}
          >
            <IconComponent
              className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.5}
            />
          </a>
        );
      })}
    </div>
  );
};

export default SocialMediaIcons;
import React from 'react';
import { useMenu } from '@/contexts/MenuContext.jsx';

const subsections = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'pasta', label: 'Pasta' },
  { id: 'chicken', label: 'Chicken' },
  { id: 'meat', label: 'Meat' },
  { id: 'salad', label: 'Salad' },
  { id: 'toast', label: 'Toast' }
];

const KitchenSubmenu = () => {
  const { activeSubcategory, setActiveSubcategory } = useMenu();

  const scrollToSection = (id) => {
    setActiveSubcategory(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-background/95 backdrop-blur-md border-b border-border/40 shadow-sm animate-in slide-in-from-top-2 duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto hide-scrollbar py-2.5 gap-2 sm:gap-4 justify-start md:justify-center items-center">
          {subsections.map((sub) => (
            <button
              key={sub.id}
              onClick={() => scrollToSection(sub.id)}
              className={`whitespace-nowrap text-sm font-medium transition-all duration-300 px-4 py-1.5 rounded-full ${
                activeSubcategory === sub.id
                  ? 'bg-secondary text-secondary-foreground shadow-sm scale-105'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KitchenSubmenu;
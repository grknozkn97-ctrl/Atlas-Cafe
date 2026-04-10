import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '@/components/ProductCard.jsx';

const coldDrinks = [
  {
    id: 'cd1',
    name: "Signature Espresso",
    description: "A double shot of our house blend, featuring notes of dark chocolate and toasted hazelnut.",
    image: "https://images.unsplash.com/photo-1676071553615-00acc66a7891"
  },
  {
    id: 'cd2',
    name: "Classic Cappuccino",
    description: "Equal parts espresso, steamed milk, and deep, velvety microfoam.",
    image: "https://images.unsplash.com/photo-1538999754724-0798d79951db"
  },
  {
    id: 'cd3',
    name: "Vanilla Bean Latte",
    description: "Smooth espresso and steamed milk, lightly sweetened with real vanilla bean syrup.",
    image: "https://images.unsplash.com/photo-1648320999153-638bf50be144"
  },
  {
    id: 'cd4',
    name: "Tropical Acai Bowl",
    description: "Blended organic acai topped with house granola, fresh berries, and coconut flakes.",
    image: "https://images.unsplash.com/photo-1547087163-b4025e8b98a8"
  },
  {
    id: 'cd5',
    name: "Green Glow Smoothie",
    description: "A refreshing blend of spinach, mango, pineapple, and coconut water.",
    image: "https://images.unsplash.com/photo-1684131144298-552bb6ea9153"
  }
];

const hotDrinks = [
  {
    id: 'hd1',
    name: 'Black Tea',
    description: 'Special Blended Tea',
    price: 1.00,
    image: 'https://images.unsplash.com/photo-1529837254279-55253e170b9b'
  },
  {
    id: 'hd2',
    name: 'Herbal Tea',
    description: 'In a special teapot with fresh herbs.',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1578741373713-dc4bc8da0f0e'
  },
  {
    id: 'hd3',
    name: 'Hot Chocolate',
    description: 'It is made with dark chocolate and milk.',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1690642109411-89f854ad9aa7'
  },
  {
    id: 'hd4',
    name: 'Hot White Chocolate',
    description: 'It is made with chocolate and milk.',
    price: 4.00,
    image: 'https://images.unsplash.com/photo-1617783171354-951d3c319890'
  }
];

const DrinksMenuPage = () => {
  const [activeTab, setActiveTab] = useState('cold');

  const activeItems = activeTab === 'cold' ? coldDrinks : hotDrinks;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>Drinks Menu | Atlas Cafe</title>
        <meta name="description" content="Discover our expertly crafted espresso drinks, teas, and refreshing smoothie bowls." />
      </Helmet>

      <main className="flex-grow py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Coffee & Refreshments
            </h1>
            <p className="text-lg text-muted-foreground">
              Expertly roasted, carefully extracted, and beautifully poured.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-muted p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('cold')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'cold'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Cold Drinks
              </button>
              <button
                onClick={() => setActiveTab('hot')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'hot'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Hot Drinks
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
            >
              {activeItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="h-full"
                >
                  <ProductCard product={item} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DrinksMenuPage;
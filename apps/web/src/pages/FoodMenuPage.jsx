import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard.jsx';
import ProductModal from '@/components/ProductModal.jsx';
import KitchenSubmenu from '@/components/KitchenSubmenu.jsx';
import { useMenu } from '@/contexts/MenuContext.jsx';

const FoodMenuPage = () => {
  const { kitchenData, activeSubcategory } = useMenu();
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Extract the currently active subcategory items from the context data
  const activeCategoryData = kitchenData?.find(cat => cat.id === activeSubcategory) || kitchenData[0];
  const activeItems = activeCategoryData ? activeCategoryData.items : [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>{`${activeCategoryData?.title || 'Menu'} | Atlas Cafe`}</title>
        <meta name="description" content={`Explore our delicious ${activeCategoryData?.title?.toLowerCase() || 'menu'} options.`} />
      </Helmet>

      <KitchenSubmenu />

      <main className="flex-grow py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {activeCategoryData?.title || 'Menu'}
            </h1>
            <p className="text-lg text-muted-foreground">
              Freshly prepared and delicious options to satisfy your cravings.
            </p>
          </div>

          {activeItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {activeItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="h-full"
                >
                  <ProductCard 
                    product={item}
                    onClick={setSelectedProduct}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No items available in this category at the moment.</p>
            </div>
          )}
        </div>
      </main>

      <ProductModal 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default FoodMenuPage;
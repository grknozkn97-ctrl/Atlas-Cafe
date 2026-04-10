import React, { createContext, useContext, useState } from 'react';

const defaultKitchenData = [
  {
    id: 'breakfast', title: 'Breakfast', items: [
      { 
        id: 'b1', 
        name: 'Fast Breakfast', 
        weight: '450 GR', 
        description: '1 Boiled Egg, 2 Borek Roll, Gouda Cheese, White Cheese, Black and Green Olives, Lettuce, Tomatoes, Cucumber, Ajvar, Honey, Butter, Bread',
        price: 7.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/7b41a8ad7014a00b8f6abaac8f2b2f5c.jpg',
        category: 'breakfast'
      },
      { 
        id: 'b2', 
        name: 'Menemen', 
        weight: '250 GR', 
        description: 'Tomato, Green Pepper, 2 Eggs, Bread',
        price: 5.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/06a4888c757b627471b3c9bd739724dc.jpg',
        category: 'breakfast'
      },
      { 
        id: 'b3', 
        name: 'Plain Egg', 
        weight: '150 GR', 
        description: '3 Eggs, Bread',
        price: 4.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/445ba067a2b85fdd92c39bb000fc0182.jpg',
        category: 'breakfast'
      },
      { 
        id: 'b4', 
        name: 'Egg With Sausage', 
        weight: '180 GR', 
        description: '3 Eggs, Sausage, Bread',
        price: 5.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/8709c7d90c379fa33258c7ca7dbc1a0d.jpg',
        category: 'breakfast'
      },
      { 
        id: 'b5', 
        name: 'Plain Omelette', 
        weight: '200 GR', 
        description: '3 Eggs, Butter, Bread',
        price: 4.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/2efb07bef7c0a12df3d3bc6ad6ca51dd.jpg',
        category: 'breakfast'
      },
      { 
        id: 'b6', 
        name: 'Omelette with sausage', 
        weight: '220 GR', 
        description: '3 Eggs, Sausage, Butter, Bread',
        price: 5.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/ef7a6f09b3cd0df0f0cbe948c3166e89.jpg',
        category: 'breakfast'
      },
    ]
  },
  {
    id: 'snacks', title: 'Snacks', items: [
      { 
        id: 'sn1', 
        name: 'French Fries', 
        weight: '250 GR', 
        description: 'French Fries', 
        price: 4.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/0cb7828d1500db277ce9ecac4242821a.jpg',
        category: 'snacks'
      },
      { 
        id: 'sn2', 
        name: 'French Fries With Sausage', 
        weight: '300 GR', 
        description: 'French Fries and Sausage', 
        price: 5.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/e0160a7378f6853aac5cfdfda752d8fe.jpg',
        category: 'snacks'
      },
      { 
        id: 'sn3', 
        name: 'Crispy Chicken', 
        weight: '300 GR', 
        description: 'French Fries, Crispy Chicken, Onion', 
        price: 7.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d2640ddbb6d634235c33572a7ad58c6f.jpg',
        category: 'snacks'
      },
      { 
        id: 'sn4', 
        name: 'Mega Mix', 
        weight: '450 GR', 
        description: 'French Fries, Onion, Crispy Chicken', 
        price: 8.00, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/c38b83719384a779de47a34a7bb25905.jpg',
        category: 'snacks'
      }
    ]
  },
  {
    id: 'pasta', title: 'Pasta', items: [
      { 
        id: 'p1', 
        name: 'Penne Alfredo', 
        weight: '300 GR',
        description: 'Pasta, Mushroom, Cream, Chicken', 
        price: 4.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/4f96400c5e0a34a65553fc210c06c50f.jpg',
        category: 'pasta'
      },
      { 
        id: 'p2', 
        name: 'Penne With Curry', 
        weight: '300 GR',
        description: 'Pasta, Mushroom, Cream, Chicken, Curry Sauce', 
        price: 4.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/b78f71fd9bf4a777655e943b40da07f7.jpg',
        category: 'pasta'
      },
      { 
        id: 'p3', 
        name: 'Penne With Pesto', 
        weight: '300 GR',
        description: 'Pasta, Mushroom, Cream, Pesto Sauce', 
        price: 4.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/53df81bb4445b63ffd3e277d80e39211.jpg',
        category: 'pasta'
      },
      { 
        id: 'p4', 
        name: 'Penne With Chili', 
        weight: '300 GR',
        description: 'Pasta, Mushroom, Cream, Chili Sauce', 
        price: 4.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/a87a20314903784d29be6de1e05331e5.jpg',
        category: 'pasta'
      },
    ]
  },
  {
    id: 'chicken', title: 'Chicken', items: [
      { 
        id: 'c1', 
        name: 'Çökertme', 
        weight: '400 GR',
        description: 'Crispy thin sliced potatoes, chicken, marinade sauce, yogurt.', 
        price: 7.50, 
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800', 
        category: 'chicken' 
      },
      { 
        id: 'c2', 
        name: 'Chicken Fajita', 
        weight: '400 GR',
        description: 'Marinated chicken, red bell pepper, green bell pepper, mushrooms', 
        price: 7.50, 
        image: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&q=80&w=800', 
        category: 'chicken' 
      },
      { 
        id: 'c3', 
        name: 'Chicken Grill', 
        weight: '400 GR',
        description: 'Chicken, Potato, Salad (tomato, cucumber)', 
        price: 7.50, 
        image: 'https://images.unsplash.com/photo-1598515318246-a6bfafb0fd28?auto=format&fit=crop&q=80&w=800', 
        category: 'chicken' 
      },
      { 
        id: 'c4', 
        name: 'Curry Sauce Chicken', 
        weight: '400 GR',
        description: 'Chicken, red bell pepper, green bell pepper, mushroom and French fries', 
        price: 7.00, 
        image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&q=80&w=800', 
        category: 'chicken' 
      },
      { 
        id: 'c5', 
        name: 'Mushroom Chicken', 
        weight: '400 GR',
        description: 'Chicken, Mushroom, Red Bell Pepper, Green Bell Pepper and French Fries', 
        price: 7.00, 
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=800', 
        category: 'chicken' 
      },
      { 
        id: 'c6', 
        name: 'Chili Sauce Chicken', 
        weight: '400 GR',
        description: 'Chicken, Mushroom, Red Bell Pepper, Green Bell Pepper, Chili sauce and French Fries', 
        price: 7.00, 
        image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?auto=format&fit=crop&q=80&w=800', 
        category: 'chicken' 
      },
    ]
  },
  {
    id: 'meat', title: 'Meat', items: [
      { 
        id: 'm1', 
        name: 'Grilled Meatballs', 
        weight: '400 GR',
        description: 'Meatball, Ajvar Sauce, Pasta, French Fries', 
        price: 7.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/b6326cfb79aaf9821eebb9fc10be9847.jpg', 
        category: 'meat' 
      },
      { 
        id: 'm2', 
        name: 'Meatball Cheddar', 
        weight: '400 GR',
        description: 'Meatball With Cheddar Cheese, Salad, French Fries', 
        price: 7.50, 
        image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/e15e9d022947180f1181372db5b3ad99.jpg', 
        category: 'meat' 
      }
    ]
  },
  {
    id: 'salad', title: 'Salad', items: [
      { 
        id: 'sl1', 
        name: 'Chicken Salad', 
        weight: '300 GR',
        description: 'Chicken, Tomato, Cucumber, Iceberg, Special Salad Sauce, Olive Oil, Lemon', 
        price: 6.50, 
        image: 'https://images.unsplash.com/photo-1496111467085-dfa7bead2ca3', 
        category: 'salad' 
      },
      { 
        id: 'sl2', 
        name: 'French Chicken Salad', 
        weight: '300 GR',
        description: 'French Chicken, Tomato, Cucumber, Iceberg, Special Salad Sauce, Olive Oil, Lemon', 
        price: 6.50, 
        image: 'https://images.unsplash.com/photo-1496111467085-dfa7bead2ca3', 
        category: 'salad' 
      },
      { 
        id: 'sl3', 
        name: 'Tuna Salad', 
        weight: '300 GR',
        description: 'Tuna, Tomato, Cucumber, Iceberg, Special Salad Sauce, Olive Oil, Lemon', 
        price: 6.50, 
        image: 'https://images.unsplash.com/photo-1656166506859-10bbcf54e37c', 
        category: 'salad' 
      }
    ]
  },
  {
    id: 'toast', title: 'Toast', items: [
      { id: 't1', name: 'Avocado Toast', description: 'Mashed avocado on sourdough', price: 9.99, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8', category: 'toast' },
      { id: 't2', name: 'Tomato Toast', description: 'Roasted tomatoes and ricotta', price: 8.99, image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543', category: 'toast' },
      { id: 't3', name: 'Mushroom Toast', description: 'Sauteed mushrooms with thyme', price: 9.99, image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804', category: 'toast' },
      { id: 't4', name: 'Egg Toast', description: 'Soft scrambled eggs on brioche', price: 8.99, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8', category: 'toast' },
    ]
  }
];

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [activeCategory, setActiveCategory] = useState('kitchen');
  const [activeSubcategory, setActiveSubcategory] = useState('breakfast');
  const [kitchenData, setKitchenData] = useState(defaultKitchenData);

  return (
    <MenuContext.Provider value={{ 
      activeCategory, 
      setActiveCategory, 
      activeSubcategory, 
      setActiveSubcategory,
      kitchenData,
      setKitchenData
    }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => useContext(MenuContext);
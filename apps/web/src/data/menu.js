// Atlas Cafe & Bar — the whole menu in one place.
//
// Each product:
//   id      stable id (also used by the order list)
//   name    shown as-is in every language, unless `names` gives a translation
//   names   optional { me, it, fr } translations of a descriptive name
//   size    portion weight or volume
//   price   euros
//   img     photo file on the CDN (only the cafe's own photos)
//   ing     ingredient keys from ingredients.js; "3:eggs" renders as "3 eggs"
//   note    optional { en, me, it, fr } one-line description instead of ingredients
//   al      allergen numbers (EU 1169/2011), from the recipe (normativ) sheet
//   kcal    energy per portion, from the recipe sheet
//   extras  key into `extras` below

const CDN = 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/';
const img = (file) => CDN + file;
const T = (en, me, it, fr) => ({ en, me, it, fr });

export const extras = {
  breakfast: [
    { id: 'x-cheese', name: T('Cheese 30 g', 'Sir 30 g', 'Formaggio 30 g', 'Fromage 30 g'), price: 0.5 },
    { id: 'x-sausage', name: T('Sausage 30 g', 'Kobasica 30 g', 'Salsiccia 30 g', 'Saucisse 30 g'), price: 1.0 },
    { id: 'x-olives', name: T('Olives 30 g', 'Masline 30 g', 'Olive 30 g', 'Olives 30 g'), price: 1.0 },
    { id: 'x-tomato', name: T('Tomato 50 g', 'Paradajz 50 g', 'Pomodoro 50 g', 'Tomate 50 g'), price: 0.4 },
    { id: 'x-cucumber', name: T('Cucumber 50 g', 'Krastavac 50 g', 'Cetriolo 50 g', 'Concombre 50 g'), price: 0.4 },
    { id: 'x-egg', name: T('Boiled egg', 'Kuvano jaje', 'Uovo sodo', 'Œuf dur'), price: 1.0 },
    { id: 'x-ajvar', name: T('Ajvar 30 g', 'Ajvar 30 g', 'Ajvar 30 g', 'Ajvar 30 g'), price: 0.7 },
    { id: 'x-honey', name: T('Honey 15 g', 'Med 15 g', 'Miele 15 g', 'Miel 15 g'), price: 0.2 },
    { id: 'x-butter', name: T('Butter 20 g', 'Puter 20 g', 'Burro 20 g', 'Beurre 20 g'), price: 1.0 },
    { id: 'x-bread', name: T('Bread 100 g', 'Hljeb 100 g', 'Pane 100 g', 'Pain 100 g'), price: 0.5 },
  ],
  snacks: [
    { id: 'x-cheddar', name: T('Cheddar 50 g', 'Čedar 50 g', 'Cheddar 50 g', 'Cheddar 50 g'), price: 0.5 },
    { id: 'x-sauce', name: T('Extra sauce', 'Dodatni sos', 'Salsa extra', 'Sauce en plus'), price: 0.2 },
  ],
  pasta: [
    { id: 'x-parmesan', name: T('Extra parmesan', 'Dodatni parmezan', 'Parmigiano extra', 'Parmesan en plus'), price: 1.0 },
    { id: 'x-pasta', name: T('Extra pasta +50 g', 'Dodatna pasta +50 g', 'Pasta extra +50 g', 'Pâtes en plus +50 g'), price: 1.0 },
  ],
  chicken: [
    { id: 'x-csauce', name: T('Extra sauce', 'Dodatni sos', 'Salsa extra', 'Sauce en plus'), price: 0.5 },
    { id: 'x-cbread', name: T('Extra bread', 'Dodatni hljeb', 'Pane extra', 'Pain en plus'), price: 0.5 },
    { id: 'x-ccheese', name: T('Extra cheese', 'Dodatni sir', 'Formaggio extra', 'Fromage en plus'), price: 1.0 },
  ],
  frozen: [
    { id: 'x-topping', name: T('Extra topping', 'Dodatni preliv', 'Topping extra', 'Topping en plus'), price: 0.5 },
    { id: 'x-fsauce', name: T('Extra sauce', 'Dodatni sos', 'Salsa extra', 'Sauce en plus'), price: 0.5 },
    { id: 'x-whip', name: T('Whipped cream', 'Šlag', 'Panna montata', 'Chantilly'), price: 0.8 },
  ],
  milkshake: [
    { id: 'x-mcream', name: T('Extra cream', 'Dodatni šlag', 'Panna extra', 'Crème en plus'), price: 0.5 },
    { id: 'x-msyrup', name: T('Extra syrup', 'Dodatni sirup', 'Sciroppo extra', 'Sirop en plus'), price: 0.3 },
    { id: 'x-mchoc', name: T('Extra chocolate', 'Dodatna čokolada', 'Cioccolato extra', 'Chocolat en plus'), price: 0.6 },
  ],
};

export const sections = [
  {
    id: 'kitchen',
    path: '/food',
    title: T('Kitchen', 'Kuhinja', 'Cucina', 'Cuisine'),
    groups: [
      {
        id: 'breakfast', title: T('Breakfast', 'Doručak', 'Colazione', 'Petit-déjeuner'), extras: 'breakfast',
        items: [
          { id: 'b1', name: 'Fast Breakfast', names: T(null, 'Brzi doručak', 'Colazione veloce', 'Petit-déjeuner express'), size: '450 g', price: 7.0, img: img('36f492d9ae1187852e4e25e4f498ad0f.jpg'),
            ing: ['1:boiledEgg', '2:borekRoll', 'gouda', 'whiteCheese', 'olives', 'lettuce', 'tomato', 'cucumber', 'ajvar', 'honey', 'butter', 'bread'], al: [1, 3, 7], kcal: 902 },
          { id: 'b7', name: 'Cheese Börek Rolls', names: T(null, 'Rolnice od bureka sa sirom', 'Rotolini di börek al formaggio', 'Roulés de börek au fromage'), size: '450 g', price: 5.0, img: img('8650dde00739c140313f17a0e7d336bb.png'),
            ing: ['10:borekRoll', 'tomato', 'cucumber', 'ajvar', 'honey', 'butter'], al: [1, 3, 7], kcal: 1114 },
          { id: 'b9', name: 'Priganice Plate', names: T(null, 'Priganice', 'Piatto di priganice', 'Assiette de priganice'), size: '450 g', price: 5.0, img: img('47579aa3227067c69e4bbaf62b339b97.png'),
            ing: ['10:priganice', 'cheese', 'honey', 'butter', 'jam'], al: [1, 3, 7], kcal: 1482 },
          { id: 'b2', name: 'Menemen', size: '250 g', price: 5.0, img: img('06a4888c757b627471b3c9bd739724dc.jpg'),
            ing: ['2:eggs', 'tomato', 'greenPepper', 'bread'], al: [1, 3], kcal: 325,
            note: T('Turkish-style scrambled eggs with tomato and pepper', 'Kajgana na turski način s paradajzom i paprikom', 'Uova strapazzate alla turca con pomodoro e peperone', 'Œufs brouillés à la turque, tomate et poivron') },
          { id: 'b3', name: 'Plain Eggs', names: T(null, 'Jaja na oko', 'Uova al tegamino', 'Œufs au plat'), size: '150 g', price: 4.0, img: img('445ba067a2b85fdd92c39bb000fc0182.jpg'),
            ing: ['3:eggs', 'bread'], al: [1, 3], kcal: 365 },
          { id: 'b4', name: 'Eggs with Sausage', names: T(null, 'Jaja s kobasicom', 'Uova con salsiccia', 'Œufs à la saucisse'), size: '180 g', price: 5.0, img: img('8709c7d90c379fa33258c7ca7dbc1a0d.jpg'),
            ing: ['3:eggs', 'sausage', 'bread'], al: [1, 3, 6], kcal: 510 },
          { id: 'b5', name: 'Plain Omelette', names: T(null, 'Omlet', 'Frittata semplice', 'Omelette nature'), size: '200 g', price: 4.5, img: img('7e92082b5cab4e86dc27086d123f22f1.jpg'),
            ing: ['3:eggs', 'butter', 'tomato', 'cucumber', 'bread'], al: [1, 3, 7], kcal: 400 },
          { id: 'b6', name: 'Omelette with Sausage', names: T(null, 'Omlet s kobasicom', 'Frittata con salsiccia', 'Omelette à la saucisse'), size: '250 g', price: 5.0, img: img('a8b51281af2e0ff45cffabce758ee765.jpg'),
            ing: ['3:eggs', 'sausage', 'butter', 'tomato', 'cucumber', 'bread'], al: [1, 3, 6, 7], kcal: 516 },
          { id: 'b10', name: 'Pancakes', names: T(null, 'Palačinke', 'Pancake', 'Pancakes'), size: '250 g', price: 5.5,
            ing: ['pancakes', 'honey', 'butter', 'chocSpread', 'fruit'], al: [1, 3, 6, 7, 8], kcal: 681 },
        ],
      },
      {
        id: 'toast', title: T('Toast', 'Tost', 'Toast', 'Croque'), extras: 'breakfast',
        items: [
          { id: 't1', name: 'Cheese Toast', names: T(null, 'Tost sa sirom', 'Toast al formaggio', 'Croque au fromage'), size: '200 g', price: 4.5, img: img('46014728a1316e8e5dc570f4c75b4124.png'),
            ing: ['toastBread', 'gouda', 'tomato', 'butter', 'fries'], al: [1, 7], kcal: 595 },
          { id: 't2', name: 'Atlas Toast', size: '250 g', price: 5.0, img: img('3f4df46b79115ef6eb2829e539d9527d.png'),
            ing: ['toastBread', 'gouda', 'sausage', 'tomato', 'ajvar', 'butter', 'fries'], al: [1, 6, 7], kcal: 700 },
          { id: 't3', name: 'Golden Egg Toast', names: T(null, 'Tost sa jajima', 'Toast con uova', 'Croque aux œufs'), size: '250 g', price: 5.8,
            ing: ['2:eggs', 'toastBread', 'gouda', 'ham', 'tomato', 'lettuce', 'fries'], al: [1, 3, 6, 7], kcal: 638 },
        ],
      },
      {
        id: 'sandwich', title: T('Sandwiches', 'Sendviči', 'Panini', 'Sandwichs'),
        items: [
          { id: 'snd1', name: 'Cheddar Sandwich', names: T(null, 'Sendvič s čedrom', 'Panino al cheddar', 'Sandwich au cheddar'), size: '200 g', price: 5.5,
            ing: ['toastBread', 'gouda', 'cheddar', 'ham', 'lettuce', 'mayo', 'fries'], al: [1, 3, 6, 7, 10], kcal: 657 },
          { id: 'snd2', name: 'Tuna Sandwich', names: T(null, 'Sendvič s tunjevinom', 'Panino al tonno', 'Sandwich au thon'), size: '250 g', price: 5.0,
            ing: ['toastBread', 'tuna', 'lettuce', 'sweetCorn', 'pickles', 'mayo', 'fries'], al: [1, 3, 4, 10], kcal: 614 },
        ],
      },
      {
        id: 'snacks', title: T('Snacks', 'Grickalice', 'Snack', 'Snacks'), extras: 'snacks',
        items: [
          { id: 'sn1', name: 'French Fries', names: T(null, 'Pomfrit', 'Patatine fritte', 'Frites'), size: '300 g', price: 4.0, img: img('0cb7828d1500db277ce9ecac4242821a.jpg'),
            ing: ['fries', 'ketchup', 'mayo'], al: [3, 10], kcal: 970 },
          { id: 'sn5', name: 'Cheddar Fries', names: T(null, 'Pomfrit s čedrom', 'Patatine al cheddar', 'Frites au cheddar'), size: '300 g', price: 5.0, img: img('c0e34ae7ea211eefaf66ba5b2a250602.jpg'),
            ing: ['fries', 'cheddar', 'ketchup', 'mayo'], al: [3, 7, 10], kcal: 1006 },
          { id: 'sn2', name: 'Fries with Sausage', names: T(null, 'Pomfrit s kobasicom', 'Patatine con salsiccia', 'Frites et saucisse'), size: '350 g', price: 5.0, img: img('e0160a7378f6853aac5cfdfda752d8fe.jpg'),
            ing: ['fries', 'sausage', 'ketchup', 'mayo'], al: [3, 6, 10], kcal: 1106 },
          { id: 'sn3', name: 'Crispy Chicken', names: T(null, 'Hrskava piletina', 'Pollo croccante', 'Poulet croustillant'), size: '400 g', price: 7.0, img: img('d2640ddbb6d634235c33572a7ad58c6f.jpg'),
            ing: ['crispyChicken', 'fries', 'ketchup', 'mayo'], al: [1, 3, 10], kcal: 1198 },
          { id: 'sn4', name: 'Mega Mix', size: '450 g', price: 8.0, img: img('c38b83719384a779de47a34a7bb25905.jpg'),
            ing: ['fries', 'onionRings', 'sausage', 'crispyChicken', 'ketchup', 'mayo'], al: [1, 3, 6, 10], kcal: 1378 },
        ],
      },
      {
        id: 'pasta', title: T('Pasta', 'Pasta', 'Pasta', 'Pâtes'), extras: 'pasta',
        items: [
          { id: 'p1', name: 'Penne Alfredo', size: '300 g', price: 5.5, img: img('75108d59c6639aefb2c7fee221d7e37c.png'),
            ing: ['chicken', 'mushroom', 'cream', 'penne', 'parmesan'], al: [1, 7], kcal: 527 },
          { id: 'p2', name: 'Curry Pasta', names: T(null, 'Pasta s karijem', 'Pasta al curry', 'Pâtes au curry'), size: '300 g', price: 5.0, img: img('54fa5764abce867403da009356288714.png'),
            ing: ['chicken', 'curry', 'cream', 'penne', 'parmesan'], al: [1, 7, 10], kcal: 563 },
          { id: 'p3', name: 'Hot Chili Pasta', names: T(null, 'Ljuta čili pasta', 'Pasta piccante', 'Pâtes pimentées'), size: '300 g', price: 5.0, img: img('d5b88a161a7bdfd2aafc1a26c2eebbfd.png'), spicy: true,
            ing: ['chicken', 'chiliSauce', 'cream', 'penne', 'parmesan'], al: [1, 7], kcal: 557 },
          { id: 'p4', name: 'Pesto Pasta', names: T(null, 'Pasta s pestom', 'Pasta al pesto', 'Pâtes au pesto'), size: '300 g', price: 5.0, img: img('125713a028b1a66bd7da0262823670b6.png'),
            ing: ['chicken', 'pesto', 'cream', 'penne', 'parmesan'], al: [1, 7, 8], kcal: 640 },
        ],
      },
      {
        id: 'chicken', title: T('Chicken', 'Piletina', 'Pollo', 'Poulet'), extras: 'chicken',
        items: [
          { id: 'c1', name: 'Chicken Çökertme', names: T(null, 'Piletina Čokertme', 'Pollo Çökertme', 'Poulet Çökertme'), size: '400 g', price: 7.5, img: img('4b78331b17c3f0165cc19181cfb052ff.png'),
            ing: ['chickenFillet', 'crispyPotato', 'yogurt', 'tomatoSauce'], al: [7], kcal: 850 },
          { id: 'c2', name: 'Chicken Fajita', names: T(null, 'Pileća fahita', 'Fajita di pollo', 'Fajita au poulet'), size: '400 g', price: 7.5,
            ing: ['chicken', 'peppers', 'onion', 'spices', 'tortilla', 'sweetChili', 'mayo'], al: [1, 3, 10], kcal: 763 },
          { id: 'c3', name: 'Grilled Chicken', names: T(null, 'Piletina sa roštilja', 'Pollo alla griglia', 'Poulet grillé'), size: '400 g', price: 7.0, img: img('4435bff0676640268870b84e134729c4.png'),
            ing: ['chicken', 'greenPepper', 'rice', 'fries', 'sideSalad'], al: [], kcal: 684 },
          { id: 'c4', name: 'Curry Chicken', names: T(null, 'Piletina u kari sosu', 'Pollo al curry', 'Poulet au curry'), size: '400 g', price: 7.0, img: img('02879ea32ab13f31682d92922137dc39.png'),
            ing: ['chicken', 'peppers', 'cream', 'curry', 'mushroom', 'sideSalad', 'fries'], al: [7, 10], kcal: 692 },
          { id: 'c5', name: 'Mushroom Chicken', names: T(null, 'Piletina s pečurkama', 'Pollo ai funghi', 'Poulet aux champignons'), size: '400 g', price: 7.0, img: img('d4c0b638559af7f047bf9ba520145293.png'),
            ing: ['chicken', 'peppers', 'cream', 'mushroom', 'tortilla', 'sideSalad'], al: [1, 7], kcal: 623 },
          { id: 'c6', name: 'Chili Chicken', names: T(null, 'Piletina u čili sosu', 'Pollo piccante', 'Poulet pimenté'), size: '400 g', price: 7.0, img: img('d4c0b638559af7f047bf9ba520145293.png'), spicy: true,
            ing: ['chicken', 'peppers', 'cream', 'chiliSauce', 'mushroom', 'fries', 'sideSalad'], al: [7], kcal: 655 },
          { id: 'c7', name: 'Chicken Sauté', names: T(null, 'Pileći sote', 'Pollo saltato', 'Poulet sauté'), size: '400 g', price: 7.0, img: img('d4c0b638559af7f047bf9ba520145293.png'),
            ing: ['chicken', 'peppers', 'cream', 'chiliSauce', 'mushroom', 'fries', 'sideSalad'], al: [7], kcal: 655 },
          { id: 'c8', name: 'Chicken Dream', size: '400 g', price: 7.5, img: img('d9166acb6031980d3e8764d0c8633307.png'),
            ing: ['chicken', 'cream', 'cheddar', 'mushroom', 'chickenSauce', 'fries'], al: [3, 7, 10], kcal: 917 },
        ],
      },
      {
        id: 'meat', title: T('Meat', 'Meso', 'Carne', 'Viande'),
        items: [
          { id: 'm1', name: 'Meatballs', names: T(null, 'Ćufte', 'Polpette', 'Boulettes de viande'), size: '400 g', price: 7.5, img: img('e8e248c8d307fbbb936576c1dc891312.jpg'),
            ing: ['meatballs', 'rice', 'fries', 'ajvar', 'greenPepper', 'bread'], al: [1, 3], kcal: 883 },
          { id: 'm2', name: 'Cheddar Meatballs', names: T(null, 'Ćufte s čedrom', 'Polpette al cheddar', 'Boulettes au cheddar'), size: '400 g', price: 8.0, img: img('78b50d86edb2f02304d6108b03777ff2.jpg'),
            ing: ['meatballs', 'cheddar', 'fries', 'sideSalad', 'tortilla'], al: [1, 3, 7], kcal: 1033 },
        ],
      },
      {
        id: 'salad', title: T('Salads', 'Salate', 'Insalate', 'Salades'),
        items: [
          { id: 'sl1', name: 'Mixed Salad', names: T(null, 'Miješana salata', 'Insalata mista', 'Salade composée'), size: '300 g', price: 4.5, img: img('bcceeb0c908bbfd593814546b0ec25c0.jpg'),
            ing: ['lettuce', 'tomato', 'cucumber', 'greenPepper', 'sweetCorn', 'blackOlives', 'dressing'], al: [12], kcal: 152 },
          { id: 'sl2', name: 'Chicken Salad', names: T(null, 'Pileća salata', 'Insalata di pollo', 'Salade de poulet'), size: '300 g', price: 5.5, img: img('f43040affcd1cc3d4e27a45eda8bb206.jpg'),
            ing: ['chickenFillet', 'lettuce', 'tomato', 'cucumber', 'greenPepper', 'sweetCorn', 'blackOlives', 'dressing'], al: [12], kcal: 273 },
          { id: 'sl3', name: 'Crispy Chicken Salad', names: T(null, 'Salata s hrskavom piletinom', 'Insalata di pollo croccante', 'Salade de poulet croustillant'), size: '300 g', price: 5.5, img: img('60875caba31cbaa8f96c5d3d3040559f.jpg'),
            ing: ['crispyChicken', 'lettuce', 'tomato', 'cucumber', 'greenPepper', 'sweetCorn', 'blackOlives', 'dressing'], al: [1, 3, 12], kcal: 359 },
          { id: 'sl4', name: 'Tuna Salad', names: T(null, 'Salata s tunjevinom', 'Insalata di tonno', 'Salade de thon'), size: '300 g', price: 5.0,
            ing: ['tuna', 'lettuce', 'tomato', 'cucumber', 'greenPepper', 'sweetCorn', 'blackOlives', 'dressing'], al: [4, 12], kcal: 282 },
        ],
      },
      {
        id: 'burger', title: T('Burgers', 'Burgeri', 'Burger', 'Burgers'),
        items: [
          { id: 'hm1', name: 'Classic Burger', names: T(null, 'Klasični burger', 'Burger classico', 'Burger classique'), size: '300 g', price: 6.0, img: img('8d3288a2a52bba2078ee389732c61f0c.png'),
            ing: ['beefPatty', 'lettuce', 'tomato', 'gouda', 'pickles', 'burgerSauce', 'ketchup', 'mayo', 'fries', 'onionRings'], al: [1, 3, 7, 10, 11], kcal: 942 },
          { id: 'hm2', name: 'Cheeseburger', size: '350 g', price: 6.5, img: img('f47d08951fd4d8f9ffe1fdea5cde7f17.png'),
            ing: ['beefPatty', 'cheddar', 'lettuce', 'pickles', 'burgerSauce', 'ketchup', 'mayo', 'fries'], al: [1, 3, 7, 10, 11], kcal: 974 },
          { id: 'hm3', name: 'Chef’s Burger', names: T(null, 'Chef burger', 'Burger dello chef', 'Burger du chef'), size: '380 g', price: 7.5, img: img('d661e13ae262986cd86e48185f983ee2.png'),
            ing: ['beefPatty', 'lettuce', 'caramelOnion', 'crispyPotato', 'pickles', 'burgerSauce', 'ketchup', 'mayo', 'onionRings', 'fries'], al: [1, 3, 10, 11], kcal: 1048 },
        ],
      },
      {
        id: 'pizza', title: T('Pizza', 'Pica', 'Pizza', 'Pizza'),
        items: [
          { id: 'pz1', name: 'Margherita', size: '300 g', price: 6.5, img: img('60b6ff8d3aa6942171ca50a156d8b2ff.png'),
            ing: ['napoliSauce', 'mozzarella', 'tomato', 'rocket', 'parmesan'], al: [1, 7], kcal: 660 },
          { id: 'pz2', name: 'Mix', names: T(null, 'Miks', 'Mista', 'Mixte'), size: '350 g', price: 7.0, img: img('c1524c1c306b3f11d9d74101e53ce9c3.png'),
            ing: ['napoliSauce', 'mozzarella', 'peppers', 'tomato', 'sausage', 'mushroom', 'blackOlives', 'rocket', 'parmesan'], al: [1, 6, 7], kcal: 716 },
          { id: 'pz3', name: 'Barbecue Chicken', names: T(null, 'Barbekju piletina', 'Pollo barbecue', 'Poulet barbecue'), size: '350 g', price: 7.5, img: img('f43a3d002e144cee15d13bca8d1c85d3.png'),
            ing: ['chickenFillet', 'bbqSauce', 'onion', 'mozzarella'], al: [1, 7, 10], kcal: 802 },
        ],
      },
      {
        id: 'wrap', title: T('Wraps', 'Rolovani sendviči', 'Piadine', 'Wraps'),
        items: [
          { id: 'wr1', name: 'Crispy Chicken Wrap', names: T(null, 'Rol s hrskavom piletinom', 'Wrap di pollo croccante', 'Wrap au poulet croustillant'), size: '300 g', price: 6.0, img: img('ab4ba18acf7d203d8eb5e28377284beb.png'),
            ing: ['crispyChicken', 'lettuce', 'burgerSauce', 'pickles', 'caramelOnion', 'cheddar', 'ketchup', 'mayo', 'fries'], al: [1, 3, 7, 10], kcal: 881 },
          { id: 'wr2', name: 'Chicken Wrap', names: T(null, 'Rol s piletinom', 'Wrap di pollo', 'Wrap au poulet'), size: '350 g', price: 6.5, img: img('c66d0cbc2a2c023bfd2d1a869d3d4ae3.png'),
            ing: ['chickenFillet', 'lettuce', 'peppers', 'tomato', 'onion', 'gouda', 'greenPepper', 'ketchup', 'mayo', 'fries'], al: [1, 3, 7, 10], kcal: 770 },
        ],
      },
    ],
  },
  {
    id: 'drinks',
    path: '/drinks',
    title: T('Drinks', 'Pića', 'Bevande', 'Boissons'),
    groups: [
      {
        id: 'hot-coffee', title: T('Coffee', 'Kafa', 'Caffè', 'Café'),
        items: [
          { id: 'cf1', name: 'Espresso', price: 1.5, al: [], kcal: 1 },
          { id: 'cf11', name: 'Double Espresso', names: T(null, 'Dupli espreso', 'Doppio espresso', 'Double espresso'), price: 2.0, al: [], kcal: 2 },
          { id: 'cf9', name: 'Kuvana Kafa', price: 1.0, ing: ['domesticCoffee'], al: [], kcal: 0 },
          { id: 'cf10', name: 'Kuvana Kafa XL', price: 1.5, ing: ['domesticCoffee'], al: [], kcal: 0 },
          { id: 'cf7', name: 'Macchiato', price: 2.0, ing: ['espresso', 'milkFoam'], al: [7], kcal: 19 },
          { id: 'cf6', name: 'Americano', price: 2.0, ing: ['espresso', 'hotWater'], al: [], kcal: 1 },
          { id: 'cf2', name: 'Latte', price: 2.5, ing: ['espresso', 'milk'], al: [7], kcal: 121 },
          { id: 'cf5', name: 'Cappuccino', price: 2.5, ing: ['espresso', 'steamedMilk'], al: [7], kcal: 91 },
          { id: 'cf3', name: 'Mocha', price: 3.0, ing: ['espresso', 'chocolate', 'milk'], al: [6, 7], kcal: 161 },
          { id: 'cf12', name: 'White Mocha', price: 3.0, ing: ['espresso', 'whiteChocolate', 'milk'], al: [7], kcal: 173 },
          { id: 'cf8', name: 'Flat White', price: 3.0, ing: ['doubleEspresso', 'microfoam'], al: [7], kcal: 74 },
        ],
      },
      {
        id: 'cold-coffee', title: T('Iced coffee', 'Ledena kafa', 'Caffè freddo', 'Café glacé'),
        items: [
          { id: 'ccf1', name: 'Iced Americano', price: 2.5, ing: ['espresso', 'ice'], al: [], kcal: 1 },
          { id: 'ccf11', name: 'Iced Latte', price: 2.8, ing: ['espresso', 'milk', 'ice'], al: [7], kcal: 109 },
          { id: 'ccf6', name: 'Iced Flat White', price: 3.5, ing: ['doubleEspresso', 'milk', 'ice'], al: [7], kcal: 92 },
          { id: 'ccf5', name: 'Iced Mocha', price: 3.2, ing: ['espresso', 'milk', 'chocSyrup', 'ice'], al: [6, 7], kcal: 161 },
          { id: 'ccf2', name: 'Iced White Mocha', price: 3.2, ing: ['espresso', 'milk', 'whiteChocSyrup', 'ice'], al: [7], kcal: 173 },
          { id: 'ccf3', name: 'Iced Caramel Latte', price: 5.5, ing: ['espresso', 'milk', 'caramelSyrup', 'ice'], al: [7], kcal: 184 },
          { id: 'ccf12', name: 'Orange Espresso', names: T(null, 'Espreso s narandžom', 'Espresso all’arancia', 'Espresso à l’orange'), price: 4.0, ing: ['espresso', 'freshOrange', 'ice'], al: [], kcal: 69 },
          { id: 'ccf13', name: 'Espresso Tonic', names: T(null, 'Espreso tonik', 'Espresso tonic', 'Espresso tonic'), price: 3.5, ing: ['espresso', 'tonic', 'ice'], al: [], kcal: 52 },
        ],
      },
      {
        id: 'hot-drink', title: T('Tea & hot drinks', 'Čaj i topli napici', 'Tè e bevande calde', 'Thés et boissons chaudes'),
        items: [
          { id: 'hd1', name: 'Black Tea', names: T(null, 'Crni čaj', 'Tè nero', 'Thé noir'), size: '70 ml', price: 1.0, al: [], kcal: 0 },
          { id: 'hd2', name: 'Herbal Tea', names: T(null, 'Biljni čaj', 'Tisana', 'Infusion'), size: '160 ml', price: 3.5, al: [], kcal: 0 },
          { id: 'hd3', name: 'Salep', size: '160 ml', price: 3.5, ing: ['salep', 'milk', 'cinnamon'], al: [7], kcal: 160 },
          { id: 'hd4', name: 'Hot Chocolate', names: T(null, 'Topla čokolada', 'Cioccolata calda', 'Chocolat chaud'), size: '160 ml', price: 4.0, ing: ['hotChocolate', 'milk'], al: [6, 7], kcal: 198 },
          { id: 'hd5', name: 'White Hot Chocolate', names: T(null, 'Topla bijela čokolada', 'Cioccolata bianca calda', 'Chocolat blanc chaud'), size: '160 ml', price: 4.0, ing: ['whiteChocolate', 'milk'], al: [6, 7], kcal: 213 },
        ],
      },
      {
        id: 'soft-drinks', title: T('Soft drinks', 'Bezalkoholna pića', 'Bibite', 'Boissons fraîches'),
        items: [
          { id: 'sd7', name: 'Fresh Orange Juice', names: T(null, 'Ceđena pomorandža', 'Spremuta d’arancia', 'Jus d’orange pressé'), price: 4.0, ing: ['freshOrange'], al: [], kcal: 112 },
          { id: 'sd6', name: 'Churchill', price: 2.5, ing: ['freshLemon', 'sparkling'], al: [], kcal: 9 },
          { id: 'sd1', name: 'Coca-Cola', price: 2.5, al: [] },
          { id: 'sd2', name: 'Coca-Cola Zero', price: 2.5, al: [] },
          { id: 'sd3', name: 'Fanta', price: 2.5, al: [] },
          { id: 'sd4', name: 'Sprite', price: 2.5, al: [] },
          { id: 'sd5', name: 'Red Bull', price: 3.0, al: [], note: T('Classic or sugar-free', 'Klasični ili bez šećera', 'Classico o senza zucchero', 'Classique ou sans sucre') },
          { id: 'sd8', name: 'Still Water', names: T(null, 'Negazirana voda', 'Acqua naturale', 'Eau plate'), price: 1.5, al: [] },
          { id: 'sd9', name: 'Sparkling Water', names: T(null, 'Gazirana voda', 'Acqua frizzante', 'Eau gazeuse'), price: 1.5, al: [] },
        ],
      },
      {
        id: 'frozen', title: T('Frozen', 'Frozen', 'Frozen', 'Frozen'), extras: 'frozen',
        items: [
          { id: 'fz1', name: 'Watermelon Frozen', names: T(null, 'Frozen od lubenice', 'Frozen all’anguria', 'Frozen pastèque'), price: 4.5, img: img('d17a3b6c3dec1bdb21ce9160fe7580df.jpg'), ing: ['watermelon', 'fruitSyrup', 'ice'], al: [], kcal: 126 },
          { id: 'fz5', name: 'Melon Frozen', names: T(null, 'Frozen od dinje', 'Frozen al melone', 'Frozen melon'), price: 4.5, img: img('d630c662700235f3af3cbb76c6cef0f4.jpg'), ing: ['melon', 'fruitSyrup', 'ice'], al: [], kcal: 132 },
          { id: 'fz2', name: 'Strawberry Frozen', names: T(null, 'Frozen od jagode', 'Frozen alla fragola', 'Frozen fraise'), price: 4.5, img: img('c9397156b09ad8370873741b8fdbaf03.jpg'), ing: ['strawberry', 'fruitSyrup', 'ice'], al: [], kcal: 129 },
          { id: 'fz3', name: 'Pineapple Frozen', names: T(null, 'Frozen od ananasa', 'Frozen all’ananas', 'Frozen ananas'), price: 4.5, img: img('64ede35429a9b34b6906e731c080d2b3.jpg'), ing: ['pineapple', 'ice'], al: [], kcal: 75 },
          { id: 'fz4', name: 'Black Mulberry Frozen', names: T(null, 'Frozen od crnog duda', 'Frozen al gelso nero', 'Frozen mûre noire'), price: 4.5, img: img('9f4720b01a499f923c0152d204620aaa.jpg'), ing: ['mulberry', 'ice'], al: [], kcal: 68 },
        ],
      },
      {
        id: 'milkshake', title: T('Milkshakes', 'Milkšejkovi', 'Frappè', 'Milk-shakes'), extras: 'milkshake',
        items: [
          { id: 'ms1', name: 'Oreo Shake', price: 5.0, ing: ['vanillaIce', 'milk', 'oreo', 'chocCream'], al: [1, 6, 7, 8], kcal: 622 },
          { id: 'ms2', name: 'Chocolate Shake', names: T(null, 'Čokoladni šejk', 'Frappè al cioccolato', 'Shake au chocolat'), price: 5.0, ing: ['chocIce', 'milk', 'chocSyrup'], al: [6, 7], kcal: 470 },
          { id: 'ms3', name: 'Strawberry Shake', names: T(null, 'Šejk od jagode', 'Frappè alla fragola', 'Shake à la fraise'), price: 5.0, ing: ['vanillaIce', 'milk', 'strawberry'], al: [7], kcal: 426 },
          { id: 'ms4', name: 'Banana Shake', names: T(null, 'Šejk od banane', 'Frappè alla banana', 'Shake à la banane'), price: 5.0, ing: ['vanillaIce', 'milk', 'banana'], al: [7], kcal: 490 },
        ],
      },
    ],
  },
  {
    id: 'bar',
    path: '/alcohol',
    title: T('Bar', 'Bar', 'Bar', 'Bar'),
    groups: [
      {
        id: 'cocktail', title: T('Cocktails', 'Kokteli', 'Cocktail', 'Cocktails'),
        items: [
          { id: 'ck6', name: 'Balkan Sunset', price: 6.0, ing: ['pearRakija', 'apricotRakija', 'orangeJuice', 'pomegranate'], al: [], kcal: 178, signature: true },
          { id: 'ck2', name: 'Aperol Spritz', price: 5.0, ing: ['aperol', 'prosecco', 'sparkling'], al: [12], kcal: 162 },
          { id: 'ck3', name: 'Campari Spritz', price: 5.0, ing: ['campari', 'prosecco', 'sparkling'], al: [12], kcal: 210 },
          { id: 'ck1', name: 'Espresso Martini', price: 5.5, ing: ['vodka', 'coffeeLiqueur', 'espresso', 'syrup'], al: [], kcal: 185 },
          { id: 'ck4', name: 'Negroni', price: 5.5, ing: ['gin', 'campari', 'vermouth'], al: [12], kcal: 183 },
          { id: 'ck5', name: 'Gin & Tonic', names: T(null, 'Džin tonik', 'Gin tonic', 'Gin tonic'), price: 4.0, ing: ['gin', 'tonic'], al: [], kcal: 166 },
          { id: 'ck12', name: 'Mojito', price: 5.0, ing: ['whiteRum', 'limeJuice', 'syrup', 'mint', 'sparkling'], al: [], kcal: 174 },
          { id: 'ck14', name: 'Cucumber Gin Fizz', price: 5.0, ing: ['gin', 'limeJuice', 'syrup', 'cucumber', 'mint', 'sparkling'], al: [], kcal: 164 },
          { id: 'ck15', name: 'Bitter Lemonade', price: 5.0, ing: ['gorkiList', 'lemonJuice', 'syrup'], al: [], kcal: 158 },
          { id: 'ck13', name: 'Cosmopolitan', price: 5.0, ing: ['vodka', 'tripleSec', 'limeJuice', 'pomegranate'], al: [], kcal: 165 },
          { id: 'ck7', name: 'Blue Lagoon', price: 5.0, ing: ['blueCuracao', 'pineappleJuice', 'sprite'], al: [], kcal: 162 },
          { id: 'ck9', name: 'Piña Colada', price: 5.5, ing: ['whiteRum', 'coconutCream', 'pineappleJuice'], al: [], kcal: 262 },
          { id: 'ck11', name: 'Whiskey Sour', price: 5.0, ing: ['whiskey', 'lemonJuice', 'syrup'], al: [], kcal: 173 },
          { id: 'ck8', name: 'Long Island', price: 6.0, ing: ['vodka', 'tequila', 'gin', 'whiteRum', 'tripleSec', 'lemonJuice', 'cola'], al: [], kcal: 219 },
          { id: 'ck16', name: 'Aperol Coconut Margarita', price: 5.0, ing: ['tequila', 'aperol', 'limeJuice', 'coconutCream'], al: [], kcal: 193 },
          { id: 'ck17', name: 'Bob Marley', price: 5.0, ing: ['tequila', 'aperol', 'limeJuice', 'coconutCream'], al: [], kcal: 193 },
        ],
      },
      {
        id: 'beer', title: T('Beer', 'Pivo', 'Birra', 'Bière'),
        items: [
          { id: 'br1', name: 'Nikšićko', size: '330 ml', price: 2.5, al: [1] },
          { id: 'br2', name: 'Nikšićko', size: '500 ml', price: 3.0, al: [1] },
          { id: 'br3', name: 'Nikšićko Tamno', size: '330 ml', price: 2.5, al: [1] },
          { id: 'br4', name: 'Tuborg', size: '330 ml', price: 2.5, al: [1] },
        ],
      },
      {
        id: 'wine', title: T('Wine', 'Vino', 'Vino', 'Vin'),
        items: [
          { id: 'wn1', name: 'Red Wine', names: T(null, 'Crno vino', 'Vino rosso', 'Vin rouge'), price: 10.0, al: [12], note: T('Cabernet, full-bodied', 'Kaberne, puno tijelo', 'Cabernet, corposo', 'Cabernet, corsé') },
          { id: 'wn2', name: 'White Wine', names: T(null, 'Bijelo vino', 'Vino bianco', 'Vin blanc'), price: 10.0, al: [12], note: T('Sauvignon Blanc, crisp', 'Sovinjon blan, svježe', 'Sauvignon Blanc, fresco', 'Sauvignon blanc, vif') },
          { id: 'wn3', name: 'Rosé', names: T(null, 'Roze', 'Rosato', 'Rosé'), price: 9.0, al: [12], note: T('Light and fruity', 'Lagano i voćno', 'Leggero e fruttato', 'Léger et fruité') },
          { id: 'wn4', name: 'Prosecco', price: 12.0, al: [12], note: T('Sparkling wine', 'Pjenušavo vino', 'Vino spumante', 'Vin pétillant') },
        ],
      },
      {
        id: 'spirits', title: T('Spirits by the bottle', 'Žestoka pića (boca)', 'Distillati in bottiglia', 'Spiritueux à la bouteille'),
        items: [
          { id: 'sp1', name: 'Skyy Vodka', size: '0.7 l', price: 30.0, al: [] },
          { id: 'sp4', name: 'Gordon’s Gin', size: '0.7 l', price: 35.0, al: [] },
          { id: 'sp3', name: 'Dark Rum', names: T(null, 'Tamni rum', 'Rum scuro', 'Rhum brun'), size: '0.7 l', price: 35.0, al: [] },
          { id: 'sp2', name: 'Jack Daniel’s', size: '0.7 l', price: 40.0, al: [] },
        ],
      },
    ],
  },
  {
    id: 'dessert',
    path: '/dessert',
    title: T('Dessert', 'Desert', 'Dolci', 'Desserts'),
    groups: [
      {
        id: 'dessert-sub', title: T('Cakes & cookies', 'Torte i kolačići', 'Torte e biscotti', 'Gâteaux et cookies'),
        items: [
          { id: 's3', name: 'Carrot Cake', names: T(null, 'Torta od šargarepe', 'Torta di carote', 'Gâteau aux carottes'), price: 4.5, img: img('9d596ad5834b7240fd18c37d3da93543.jpg'), al: [1, 3, 7, 8], kcal: 406,
            note: T('Spiced carrot sponge, walnuts and cream-cheese frosting', 'Biskvit od šargarepe sa začinima, orasi i krem od krem-sira', 'Pan di spezie alle carote, noci e crema al formaggio', 'Génoise épicée aux carottes, noix et glaçage au fromage frais') },
          { id: 's1', name: 'Mosaic Cake', names: T(null, 'Mozaik torta', 'Torta mosaico', 'Gâteau mosaïque'), price: 4.0, img: img('0ee365d76af479cbde68c15451776dff.jpg'), al: [1, 6, 7], kcal: 472,
            note: T('Chocolate and biscuit, no-bake classic', 'Čokolada i keks, klasik bez pečenja', 'Cioccolato e biscotti, classico senza cottura', 'Chocolat et biscuits, classique sans cuisson') },
          { id: 's2', name: 'Chocolate Cookie', names: T(null, 'Čokoladni kolačić', 'Biscotto al cioccolato', 'Cookie au chocolat'), price: 2.5, img: img('1c099359d34a55d109c13fb4d0c7412e.jpg'), al: [1, 3, 6, 7], kcal: 270,
            note: T('Butter cookie with chocolate chips', 'Kolačić s puterom i komadićima čokolade', 'Biscotto al burro con gocce di cioccolato', 'Cookie au beurre et pépites de chocolat') },
        ],
      },
    ],
  },
];

// Flat lookup by id.
export const itemsById = {};
for (const s of sections) for (const g of s.groups) for (const it of g.items) {
  itemsById[it.id] = { ...it, sectionId: s.id, groupId: g.id, extrasKey: g.extras };
}

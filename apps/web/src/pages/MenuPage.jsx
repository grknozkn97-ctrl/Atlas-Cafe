import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import MenuCard from '@/components/MenuCard.jsx';
import ProductModal from '@/components/ProductModal.jsx';
import FeaturedProductsCarousel from '@/components/FeaturedProductsCarousel.jsx';
import SocialMediaIcons from '@/components/SocialMediaIcons.jsx';
import { cn } from '@/lib/utils.js';

const kitchenData = [
  {
    id: 'breakfast', title: 'Breakfast', items: [
      { id: 'b1', name: 'Fast Breakfast', weight: '450 GR', description: '1 Boiled Egg, 2 Borek Roll, Gouda Cheese, White Cheese, Black and Green Olives, Lettuce, Tomatoes, Cucumber, Ajvar, Honey, Butter, Bread', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/36f492d9ae1187852e4e25e4f498ad0f.jpg' },
      { id: 'b7', name: 'Burek Plate', weight: '450 GR', description: '1 Boiled Egg, 2 Borek Roll, Gouda Cheese, White Cheese, Black and Green Olives, Lettuce, Tomatoes, Cucumber, Ajvar, Honey, Butter, Bread', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/8650dde00739c140313f17a0e7d336bb.png' },
      { id: 'b9', name: 'Priganice Plate', weight: '450 GR', description: '10 Pişi, Cheese, Honey with Butter, Jam', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/47579aa3227067c69e4bbaf62b339b97.png' },
      { id: 'b2', name: 'Menemen', weight: '250 GR', description: 'Tomato, Green Pepper, 2 Eggs, Bread', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/06a4888c757b627471b3c9bd739724dc.jpg' },
      { id: 'b3', name: 'Plain Egg', weight: '150 GR', description: '3 Eggs, Bread', price: 4.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/445ba067a2b85fdd92c39bb000fc0182.jpg' },
      { id: 'b4', name: 'Egg With Sausage', weight: '180 GR', description: '3 Eggs, Sausage, Bread', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/8709c7d90c379fa33258c7ca7dbc1a0d.jpg' },
      { id: 'b5', name: 'Plain Omelette', weight: '200 GR', description: '3 Eggs, Butter, Bread, Cucumber, Tomato', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/7e92082b5cab4e86dc27086d123f22f1.jpg' },
      { id: 'b6', name: 'Omelette with sausage', weight: '250 GR', description: '3 Eggs, Sausage, Butter, Bread, Cucumber, Tomato', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/a8b51281af2e0ff45cffabce758ee765.jpg' },
      { id: 'b10', name: 'Pancake', weight: '250 GR', description: '10 Pcs, Honey with Butter, Chocolate, Fruits', price: 5.50, image: 'https://www.freee-foods.co.uk/wp-content/uploads/sites/2/2021/05/FR042_American-Style-Pancakes-1080.jpg' },
    ]
  },
  {
    id: 'toast', title: 'Toast', items: [
      { id: 't1', name: 'Toast With Cheese', weight: '200 GR', description: 'Gouda, Tomato, Butter, Bread, French Fries', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/46014728a1316e8e5dc570f4c75b4124.png' },
      { id: 't2', name: 'Atlas Toast', weight: '250 GR', description: 'Gouda, Sausage, Tomato, Ajvar, Butter, Bread, French Fries', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/3f4df46b79115ef6eb2829e539d9527d.png' },
      { id: 't3', name: 'Golden Egg Toast', weight: '250 GR', description: '2 Eggs, Tomato, Gouda, Lettuce, 2 Toast Bread, French Fries', price: 5.80, image: 'https://goldentruffle.com/wp-content/uploads/2022/06/finished-ham-and-egg-sandwich-1-500x500.jpg' },
    ]
  },
  {
    id: 'Sandwich', title: 'Sandwich', items: [
      { id: 'snd1', name: 'Cheddar Cheese Sandwich', weight: '200 GR', description: 'Gouda, Cheddar, Ham, Lettuce, Cheese, Mayonnaise, Toast Bread, French Fries', price: 5.50, image: 'https://parade.com/.image/c_fill,w_1200,h_1200,g_faces:center/ODowMDAwMDAwMDAwNzYyMTQ5/gettyimages-1414766514.jpg' },
      { id: 'snd2', name: 'Tuna Sandwich', weight: '250 GR', description: 'Tuna, Sweet Corn, Pickle, Mayonnaise, Toast Bread, French Fries', price: 5.00, image: 'https://www.allrecipes.com/thmb/zjRwL5yyBrIIirnMjPEpm4xUXQU=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/98579-barbies-tuna-salad-DDMFS-4x3-f035868432e14a479ca4bc349011bf19.jpg' },
    ]
  },
  {
    id: 'snacks', title: 'Snacks', items: [
      { id: 'sn1', name: 'French Fries', weight: '300 GR', description: 'French Fries, Ketchup, Mayonnaise', price: 4.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/0cb7828d1500db277ce9ecac4242821a.jpg' },
      { id: 'sn5', name: 'Cheedar French Fries', weight: '300 GR', description: 'Chedar Cheese, French Fries, Ketchup, Mayonnaise', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/c0e34ae7ea211eefaf66ba5b2a250602.jpg' },
      { id: 'sn2', name: 'French Fries With Sausage', weight: '350 GR', description: 'French Fries and Sausage, Ketchup, Mayonnaise', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/e0160a7378f6853aac5cfdfda752d8fe.jpg' },
      { id: 'sn3', name: 'Crispy Chicken', weight: '400 GR', description: 'French Fries, Crispy Chicken, Onion, Ketchup, Mayonnaise', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d2640ddbb6d634235c33572a7ad58c6f.jpg' },
      { id: 'sn4', name: 'Mega Mix', weight: '450 GR', description: 'French Fries, Onion, Crispy Chicken, Ketchup, Mayonnaise', price: 8.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/c38b83719384a779de47a34a7bb25905.jpg' }
    ]
  },
  {
    id: 'pasta', title: 'Pasta', items: [
      { id: 'p1', name: 'Penne Alfredo', weight: '300 GR', description: 'Chicken, Mushroom, Cream, Penne Pasta, Parmesan', price: 5.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/75108d59c6639aefb2c7fee221d7e37c.png' },
      { id: 'p2', name: 'Curry Pasta', weight: '300 GR' ,description: 'Chicken, Curry Spice, Cream, Penne Pasta, Parmesan', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/54fa5764abce867403da009356288714.png' },
      { id: 'p3', name: 'Hot Chili Pasta', weight: '300 GR' ,description: 'Chicken, Pesto Souce, Cream, Penne Pasta, Parmesan', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d5b88a161a7bdfd2aafc1a26c2eebbfd.png' },
      { id: 'p4', name: 'Pesto Pasta', weight: '300 GR', description: 'Chicken, Chili Souce, Cream, Penne Pasta, Parmesan', price: 5.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/125713a028b1a66bd7da0262823670b6.png' },
    ]
  },
  {
    id: 'chicken', title: 'Chicken', items: [
      { id: 'c1', name: 'Chicken Cokertme', weight: '400 GR', description: 'Chicken Fillet, Crispy Pototoes, Yogurt, Tomato Source', price: 7.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/4b78331b17c3f0165cc19181cfb052ff.png' },
      { id: 'c2', name: 'Chicken Fajita', weight: '400 GR', description: 'Chicken, Peppers, Mushroom, Onion, Spices, Tortilla Bread, Sweet Chili Souce, Mayonnaise', price: 7.50, image: 'https://www.thecookierookie.com/wp-content/uploads/2023/03/featured-chicken-fajitas-recipe.jpg' },
      { id: 'c3', name: 'Chicken Grill', weight: '400 GR', description: 'Chicken, Green Pepper, Rice, French Fries', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/4435bff0676640268870b84e134729c4.png' },
      { id: 'c4', name: 'Curry Sauce Chicken', weight: '400 GR', description: 'Chicken, Peppers, Cream, Curry Spice, Mushroom, Salad ', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/02879ea32ab13f31682d92922137dc39.png' },
      { id: 'c5', name: 'Mushroom Chicken', weight: '400 GR', description: 'Chicken, Peppers, Cream, Mushroom, Tortilla Bread, Salad ', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d4c0b638559af7f047bf9ba520145293.png' },
      { id: 'c6', name: 'Chili Souce Chicken', weight: '400 GR', description: 'Chicken, Peppers, Cream, Chilli Sauce, Mushroom, French Fries, Salad ', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d4c0b638559af7f047bf9ba520145293.png' },
      { id: 'c7', name: 'Chicken Saute', weight: '400 GR', description: 'Chicken, Peppers, Cream, Chilli Sauce, Mushroom, French Fries, Salad ', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d4c0b638559af7f047bf9ba520145293.png' },
      { id: 'c8', name: 'Chicken Saute', weight: '400 GR', description: 'Chicken, Peppers, Cream, Chilli Sauce, Mushroom, French Fries, Salad ', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d9166acb6031980d3e8764d0c8633307.png' },
    ]
  },
  {
    id: 'meat', title: 'Meat', items: [
      { id: 'm1', name: 'Meatball', weight : '400GR', description: 'Meatball, Rice, French Fries, Ajvar, Green Pepper, Bread', price: 7.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/e8e248c8d307fbbb936576c1dc891312.jpg' },
      { id: 'm2', name: 'Meatball Cheddar', weight : '400 GR', description: 'Meatball, Cheddar, French Fries, Salad, Tortilla Bread', price: 8.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/78b50d86edb2f02304d6108b03777ff2.jpg' },
    ]
  },
  {
    id: 'salad', title: 'Salad', items: [
      { id: 'sl1', name: 'Mixed Salad',weight: '300 GR', description: 'Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn, Black Olive, Salad Dressing', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/bcceeb0c908bbfd593814546b0ec25c0.jpg' },
      { id: 'sl2', name: 'Chicken Salad', weight: '300 GR', description: 'Chicken Fillet, Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn, Black Olive, Salad Dressing', price: 5.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/f43040affcd1cc3d4e27a45eda8bb206.jpg' },
      { id: 'sl3', name: 'Crispy Chicken Salad', weight: '300 GR', description: 'Crispy Chicken, Lettuce, Tomato, Cucumber, Green pepper, Sweet Corn, Black Olive, Salad Dressing', price: 5.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/60875caba31cbaa8f96c5d3d3040559f.jpg' },
      { id: 'sl4', name: 'Tuna Salad', weight: '300 GR', description: 'Tuna, Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn,Black Olive, Salad Dressing', price: 5.00, image: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
    ]
  },
  {
    id: 'Hamburger', title: 'Hamburger', items: [
      { id: 'hm1', name: 'Classic Hamburger', weight: '300 GR', description: 'Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn, Black Olive, Salad Dressing', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/8d3288a2a52bba2078ee389732c61f0c.png' },
      { id: 'hm2', name: 'Cheeseburger', weight: '350 GR', description: 'Chicken Fillet, Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn, Black Olive, Salad Dressing', price: 5.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/f47d08951fd4d8f9ffe1fdea5cde7f17.png' },
      { id: 'hm3', name: 'Chefs burger', weight: '380 GR', description: 'Crispy Chicken, Lettuce, Tomato, Cucumber, Green pepper, Sweet Corn, Black Olive, Salad Dressing', price: 5.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d661e13ae262986cd86e48185f983ee2.png' },
    ]
  },
  {
    id: 'Pizza', title: 'Pizza', items: [
      { id: 'pz1', name: 'Margarita', weight: '300 GR', description: 'Napoliten Souce, Gouda, Tomato, Roka, Parmesan', price: 6.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/60b6ff8d3aa6942171ca50a156d8b2ff.png' },
      { id: 'pz2', name: 'Mix', weight: '350 GR', description: 'Napoliten Souce, Peppers, Tomato, Sousage, Mushroom, Black Olives', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/f43a3d002e144cee15d13bca8d1c85d3.png' },
      { id: 'pz3', name: 'Berbeque Chicken', weight: '350 GR', description: 'Chicken Fillet, Barbeque Souce, Onion, Mozerella, Ketchup, Mayonnaise, French Fries', price: 7.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/c1524c1c306b3f11d9d74101e53ce9c3.png' },
    ]
  },
  {
    id: 'Wrap', title: 'Wrap', items: [
      { id: 'wr1', name: 'Crispy Chicken Wrap', weight: '300 GR', description: 'Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn, Black Olive, Salad Dressing', price: 6.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/ab4ba18acf7d203d8eb5e28377284beb.png' },
      { id: 'wr2', name: 'Chikcken Wrap', weight: '350 GR', description: 'Chicken Fillet, Lettuce, Tomato, Cucumber, Green Pepper, Sweet Corn, Black Olive, Salad Dressing', price: 6.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/c66d0cbc2a2c023bfd2d1a869d3d4ae3.png' },
    ]
  }
];

const drinkData = [
  {
    id: 'hot-drink', title: 'Hot Drink', items: [
      { id: 'hd1', name: 'Black Tea', description: '70 ML', price: 1.00, image: 'https://images.unsplash.com/photo-1715017245420-9638115138a4?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'hd2', name: 'Herbel Tea', description: '160 ML', price: 3.50, image: 'https://plus.unsplash.com/premium_photo-1731696604052-d0c8527e7831?q=80&w=1960&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'hd3', name: 'Salep', description: '160 ML', price: 3.50, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2' },
      { id: 'hd4', name: 'Hot Choclate', description: '160 ML', price: 4.00, image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'hd5', name: 'Hot White Choclate', description: '160 ML', price: 4.00, image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
    ]
  },
  {
    id: 'hot-coffee', title: 'Hot Coffee', items: [
      { id: 'cf1', name: 'Espresso Single', description: 'Rich, concentrated coffee shot', price: 1.50, image: 'https://images.unsplash.com/photo-1557522862-bbad97b5e15e' },
      { id: 'cf11', name: 'Espresso Double', description: 'Rich, concentrated coffee 2 shot', price: 2.00, image: 'https://images.unsplash.com/photo-1557522862-bbad97b5e15e' },
      { id: 'cf9', name: 'Kuvana Kafa', description: 'Rich concentrated Kuvana Kafa', price: 1.00, image: 'https://images.unsplash.com/photo-1506778020041-0ea35027d019?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'cf10', name: 'Kuvana Kafa (XL)', description: 'Rich concentrated Kuvana Kafa', price: 1.50, image: 'https://images.unsplash.com/photo-1506778020041-0ea35027d019?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'cf7', name: 'Macchiato', description: 'Espresso marked with foam', price: 2.00, image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2' },
      { id: 'cf6', name: 'Americano', description: 'Espresso with hot water', price: 2.00, image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c' },
      { id: 'cf2', name: 'Latte', description: 'Smooth espresso and velvety milk', price: 2.50, image: 'https://images.unsplash.com/photo-1568228156290-45edbd928166' },
      { id: 'cf5', name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 2.50, image: 'https://images.unsplash.com/photo-1473923377535-0002805f57e8?q=80&w=2508&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'cf3', name: 'Mocha', description: 'Espresso with chocolate and milk', price: 3.00, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d' },
      { id: 'cf12', name: 'White Mocha', description: 'Espresso with White chocolate and milk', price: 3.00, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d' },
      { id: 'cf8', name: 'Flat White', description: 'Espresso with microfoam milk', price: 3.00, image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61' },
      
    ]
  },
  {
    id: 'cold-coffee', title: 'Cold Coffee', items: [
      { id: 'ccf1', name: 'Ice Americano', description: 'Espresso with ice', price: 2.50, image: 'https://images.unsplash.com/photo-1653122025682-1088e9bc9f08?q=80&w=986&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'ccf11', name: 'Ice Latte', description: 'Espresso with ice milk and ice', price: 2.80, image: 'https://images.unsplash.com/photo-1566704284379-0d6fdf3d229c?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'ccf6', name: 'Ice Flat White', description: 'Double Espresso with ice milk and ice', price: 3.50, image: 'https://images.unsplash.com/photo-1566704284379-0d6fdf3d229c?q=80&w=1064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'ccf5', name: 'Ice Mocha', description: 'Espresso with ice milk and choclate syrup', price: 3.20, image: 'https://images.unsplash.com/photo-1527156231393-7023794f363c?q=80&w=1011&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'ccf2', name: 'Ice White Mocha', description: 'Espresso with ice milk and White choclate syrup', price: 3.20, image: 'https://images.unsplash.com/photo-1527156231393-7023794f363c?q=80&w=1011&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
      { id: 'ccf3', name: 'Ice Caramel Latte', description: 'Espresso with chocolate and milk', price: 5.50, image: 'https://images.unsplash.com/photo-1527156231393-7023794f363c?q=80&w=1011&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D$0' },
    ]
  },
  {

    id: 'soft-drinks', title: 'Soft Drinks', items: [
      { id: 'sd1', name: 'Coca Cola', description: 'Classic chilled cola', price: 2.50, image: 'https://sales.cantin.gr/uploads/photos/59cc65a7476e53f0dbe0d095af9500e7.jpg' },
      { id: 'sd2', name: 'Coca Cola Zero', description: 'Zero Sugar chilled cola', price: 2.50, image: 'https://images.migrosone.com/sanalmarket/product/08010202/08010202_1-493823-1650x1650.jpg' },
      { id: 'sd3', name: 'Fanta', description: 'Classic chilled Fanta', price: 2.50, image: 'https://images.migrosone.com/sanalmarket/product/08020000/08020000_1-c20362.jpg' },
      { id: 'sd4', name: 'Sprite', description: 'Classic chilled Sprite', price: 2.50, image: 'https://images.migrosone.com/sanalmarket/product/08030000/08030000_1-881eaf-1650x1650.png' },
      { id: 'sd5', name: 'Redbull', description: 'Classic Redbull Or Sugar Free', price: 3.00, image: 'https://vivregourmet.com/wp-content/uploads/2020/07/60.png' },
      { id: 'sd6', name: 'Churchill', description: 'Freshly squeezed lemons with Sparkling Water', price: 2.50, image: 'https://siricoffee.com/images/menu/soguk/churcill.jpg' },
      { id: 'sd7', name: 'Orange Juice', description: 'Fresh squeezed oranges', price: 4.00, image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423' },
      { id: 'sd8', name: 'Water', description: 'Water', price: 1.50, image: 'https://www.calix.rs/uploads/store/products/images/voda-negazirana-rosa-033l-68ee33eae1bfe.webp' },
      { id: 'sd9', name: 'Sparkling Water', description: 'Sparkling Water', price: 1.50, image: 'https://www.ediskont.rs/uploads/store/products/images/knjaz-milos-gazirana-voda-0.25l-u-paketu-od-24-komada-1101-618bb6a19d487.webp' },
    ]
  },
  {
    id: 'frozen', title: 'Frozen', items: [
      { id: 'fz1', name: 'Watermelon Frozen', description: 'Watermelon, İce and watermelon syrup', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d17a3b6c3dec1bdb21ce9160fe7580df.jpg' },
      { id: 'fz5', name: 'Melon Frozen', description: 'Melon, İce and watermelon syrup', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/d630c662700235f3af3cbb76c6cef0f4.jpg' },
      { id: 'fz2', name: 'Strawberry Frozen', description: 'Strawberry, İce and Strawberry Syrup', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/c9397156b09ad8370873741b8fdbaf03.jpg' },
      { id: 'fz3', name: 'Pineapple Frozen', description: 'Pineapple Pure and İce', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/64ede35429a9b34b6906e731c080d2b3.jpg' },
      { id: 'fz4', name: 'Blackmulberry Frozen', description: 'Mulberry Pure and İce', price: 4.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/9f4720b01a499f923c0152d204620aaa.jpg' },
    ]
  },
  {
    id: 'milkshake', title: 'Milkshake', items: [
      { id: 'ms1', name: 'Oreo Shake', description: 'Classic oreo and Special Choclate cream bean blend', price: 5.00, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
      { id: 'ms2', name: 'Chocolate Shake', description: 'Rich chocolate ice cream blend', price: 5.00, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
      { id: 'ms3', name: 'Strawberry Shake', description: 'Fresh strawberry blend', price: 5.00, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
      { id: 'ms4', name: 'Banana Shake', description: 'Creamy banana blend', price: 5.00, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699' },
    ]
  },
  
];

const alcoholData = [
  {
    id: 'beer', title: 'Beer', items: [
      { id: 'br1', name: 'Niksicko', description: '330 ML', price: 2.50, image: 'https://www.calix.rs/uploads/store/products/images/pivo-niksicko-npb-033l-6502fc579eb90.webp' },
      { id: 'br2', name: 'Niksicko', description: '500 ML', price: 3.00, image: 'https://img.ep-cdn.com/i/500/500/rj/rjgkeyflviomxsbwahqd/niksicko-svetlo-pivo-500ml-staklo-cene.jpg' },
      { id: 'br3', name: 'Niksicko Tamo', description: '330 ML', price: 2.50, image: 'https://www.calix.rs/uploads/store/products/images/pivo-niksicko-tamno-033l-66754e0f10a15.webp' },
      { id: 'br4', name: 'Tuborg', description: '330 ML', price: 2.50, image: 'https://www.oaks.delivery/wp-content/uploads/Tuborg-Beer-330ml-Bottle.png' },
    ]
  },
  {
    id: 'cocktail', title: 'Cocktail', items: [
      { id: 'ck1', name: 'Espresso Martini', description: 'Vodka, Coffee Liquer, Espresso, Simple Syrup', price: 5.50, image: 'https://punchdrink.com/wp-content/uploads/2023/06/Article2-Nonalcoholic-Espresso-Martini.jpg?w=800' },
      { id: 'ck2', name: 'Aperol Spritz', description: 'Aperol, Procesco, Sparkling Water', price: 5.00, image: 'https://www.rhodos-wiefelstede.de/media/b6/fa/58/1633338410/Aperol-Spritz.jpg' },
      { id: 'ck3', name: 'Campari Spritz', description: 'Campari, Procesco, Sparkling Water', price: 5.00, image: 'https://drinksworld.com/wp-content/uploads/Campari-Spritz-02-scaled.jpg' },
      { id: 'ck4', name: 'Negroni', description: 'Gin,Campery, Sweet Vermoud', price: 5.50, image: 'https://assets.bonappetit.com/photos/626710f327b006dd474788c9/1:1/w_3118,h_3118,c_limit/0425-negroni-recipe.jpg' },
      { id: 'ck5', name: 'Cin-Tonic', description: 'Cin, Tonic', price: 4.00, image: 'https://www.thespruceeats.com/thmb/0noKFvArOC2N2Eg4pA7uwc0bC30=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/gin-and-tonic-recipe-759300-hero-01-aa12e6504f944c54b8b9c589cc1d0ac6.jpg' },
      { id: 'ck6', name: 'Balkan Sunset', description: 'Pear, Rakija, Apricot Rakija, Fresh Orange Juice, Pomegranate Juice', price: 6.00, image: 'https://calmabalkancuisine.com/wp-content/uploads/2021/07/Balkan-Paradise-for-her-400x700.jpg' },
      { id: 'ck7', name: 'Blue Lagoon', description: 'Blue Curacao, Pineapple Juice, Sprite', price: 5.00, image: 'https://vintageamericancocktails.com/wp-content/uploads/2022/04/blue_lagoon.jpg' },
      { id: 'ck8', name: 'Long island', description: 'Vodka, Tequile, Gin, White Rum, Triple Sec, Lemon Juice, Cola', price: 6.00, image: 'https://www.gurmerehberi.com/wp-content/uploads/2024/01/long-island-ice-tea.jpg' },
      { id: 'ck9', name: 'Pina Colada', description: 'White Rum, Coconut Cream, Pineapple juice', price: 5.50, image: 'https://spiritedcocktails.se/wp-content/uploads/2025/11/Pina-Colada.webp' },
      { id: 'ck11', name: 'Whiskey Source', description: 'Whiskey, Lemon Juice, Simple juice', price: 5.00, image: 'https://oasis.ca/wp-content/uploads/2023/05/img-whiskey-sour.png' },
      { id: 'ck12', name: 'Mojito', description: 'White Rum, Lime Juice, Simple Syrup, Mint, Sparkling Water', price: 5.00, image: 'https://kitchenswagger.com/wp-content/uploads/2020/07/mojito-recipe_0009_DSC_5509.jpg' },
      { id: 'ck13', name: 'Cosmopolitan', description: 'Vodka, Triple Sec, Lime Juice, pomagranate Juice', price: 5.00, image: 'https://foodandsun.com/wp-content/uploads/2020/07/Cosmopolitan.jpeg' },
      { id: 'ck14', name: 'Cucumber Gin Fizz', description: 'Gin, Lime Juice, Simple Syrup, Cucumber, Sparkling Water, Mint', price: 5.00, image: 'https://www.brighteyedbaker.com/wp-content/uploads/2020/08/cucumber-mint-gin-fizz-6.jpg' },
      { id: 'ck15', name: 'Bitter Lemonade', description: 'Gorgi List, Lemon Juice, Simple Syrup', price: 5.00, image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b' },
      { id: 'ck16', name: 'Aperol Coconut Margarita', description: 'Tequile, Aperol, Lime Juice, Coconut Cream', price: 5.00, image: 'https://cdn.sanity.io/images/mrmdqr1f/production/56d09b42e3dcb2aa1834cc69a9045db53cb9453c-1000x800.png?w=600&fit=max&auto=format' },
      { id: 'ck17', name: 'Bob Marley', description: 'Tequile, Aperol, Lime Juice, Coconut Cream', price: 5.00, image: 'https://cdn.sanity.io/images/mrmdqr1f/production/56d09b42e3dcb2aa1834cc69a9045db53cb9453c-1000x800.png?w=600&fit=max&auto=format' },
    ]
  },
  {
    id: 'spirits', title: 'Spirits & Liqueurs', items: [
      { id: 'sp1', name: 'Sky Vodka', description: '700 ML', price: 30.00, image: 'https://vinosonline.es/9143-thickbox_default/skyy-vodka-70-cl.jpg' },
      { id: 'sp2', name: 'Jack Daniels Whiskey', description: 'Aged single malt', price: 40.00, image: 'https://cdn.webshopapp.com/shops/242291/files/183105740/image.jpg' },
      { id: 'sp3', name: 'Rum', description: 'Dark spiced rum', price: 35.00, image: 'https://vinosonline.es/11094-large_default/captain-morgan-original-spiced-gold-rum-70-cl.jpg' },
      { id: 'sp4', name: 'Gordons Gin', description: '700 ML', price: 35.00, image: 'https://vinosonline.es/10605-thickbox_default/gordons-70-cl.jpg' },
    ]
  },
  {
    id: 'wine', title: 'Wine', items: [
      { id: 'wn1', name: 'Red Wine', description: 'Full-bodied Cabernet', price: 10.00, image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb' },
      { id: 'wn2', name: 'White Wine', description: 'Crisp Sauvignon Blanc', price: 10.00, image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809' },
      { id: 'wn3', name: 'Rose', description: 'Light and fruity', price: 9.00, image: 'https://images.unsplash.com/photo-1559564484-e48b3e040ff4' },
      { id: 'wn4', name: 'Sparkling Wine', description: 'Bubbly Prosecco', price: 12.00, image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a' },
    ]
  }
];

const dessertData = [
  {
    id: 'dessert-sub', title: 'Dessert', items: [
      { id: 's1', name: 'Mozaic Cake', description: 'Rich chocolate cake with ganache', price: 7.50, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/0ee365d76af479cbde68c15451776dff.jpg' },
      { id: 's2', name: 'Choclate Cokie', description: 'Classic Italian dessert with mascarpone', price: 8.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/1c099359d34a55d109c13fb4d0c7412e.jpg' },
      { id: 's3', name: 'Carrot Cake', description: 'Creamy cheesecake with berry topping', price: 7.00, image: 'https://horizons-cdn.hostinger.com/9990fccc-f647-46a3-9783-2f5f1ca49c5d/9d596ad5834b7240fd18c37d3da93543.jpg' },
    ]
  }
];

const categories = [
  { id: 'section-kitchen', label: 'Kitchen' },
  { id: 'section-drink', label: 'Drink' },
  { id: 'section-alcohol', label: 'Alcohol' },
  { id: 'section-dessert', label: 'Dessert' }
];

const MenuPage = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeMainCategory, setActiveMainCategory] = useState('section-kitchen');
  const [activeSubCategory, setActiveSubCategory] = useState('Breakfast');
  
  const mainObserverRef = useRef(null);
  const subObserverRef = useRef(null);

  // Reset scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Observer for Main Categories (Tabs)
    const mainObserverOptions = {
      root: null,
      rootMargin: '-140px 0px -60% 0px',
      threshold: 0
    };

    const mainObserverCallback = (entries) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const categoryId = visibleEntries[0].target.getAttribute('id');
        if (categoryId) {
          setActiveMainCategory(categoryId);
        }
      }
    };

    mainObserverRef.current = new IntersectionObserver(mainObserverCallback, mainObserverOptions);
    const mainSections = document.querySelectorAll('div[data-main-category="true"]');
    mainSections.forEach(section => mainObserverRef.current.observe(section));

    // Observer for Sub Categories (Dynamic Title)
    const subObserverOptions = {
      root: null,
      rootMargin: '-140px 0px -70% 0px',
      threshold: 0
    };

    const subObserverCallback = (entries) => {
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const title = visibleEntries[0].target.getAttribute('data-title');
        if (title) {
          setActiveSubCategory(title);
        }
      }
    };

    subObserverRef.current = new IntersectionObserver(subObserverCallback, subObserverOptions);
    const subSections = document.querySelectorAll('section[data-title]');
    subSections.forEach(section => subObserverRef.current.observe(section));

    return () => {
      if (mainObserverRef.current) mainObserverRef.current.disconnect();
      if (subObserverRef.current) subObserverRef.current.disconnect();
    };
  }, []);

  const scrollToCategory = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130; 
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveMainCategory(id);
    }
  };

  const handleCarouselProductClick = (targetId) => {
    const el = document.getElementById(targetId);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 130;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const renderSectionGroup = (id, title, dataArray) => (
    <div id={id} data-main-category="true" className="mb-16 pt-4 scroll-mt-[140px]">
      <div className="flex items-center gap-4 mb-8 pb-2 border-b border-border/50">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="flex flex-col gap-12 sm:gap-16">
        {dataArray.map((section) => (
          <section 
            key={section.id} 
            id={section.id} 
            data-title={section.title}
            className="scroll-mt-[140px]"
          >
            <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-6">
              {section.title}
            </h3>
            <div className="flex flex-col gap-4">
              {section.items.map((item) => (
                <MenuCard
                  key={item.id}
                  product={{ 
                    ...item, 
                    category: section.id,
                    mainCategory: id
                  }}
                  onClick={setSelectedProduct}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32 md:pb-64 relative">
      <Helmet>
        <title>Menu | Atlas Cafe</title>
        <meta name="description" content="Explore the delicious offerings at Atlas Cafe." />
      </Helmet>

      {/* Featured Products Carousel - Placed ABOVE the sticky header */}
      <FeaturedProductsCarousel onProductClick={handleCarouselProductClick} />

      {/* Social Media Icons Section */}
      <div className="py-6 sm:py-8">
        <SocialMediaIcons />
      </div>

      {/* Combined Sticky Header: Dynamic Title + Category Tabs */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border/50 shadow-sm transition-all duration-300 flex flex-col">
        
        {/* Dynamic Subcategory Title */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-4 pb-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight transition-all duration-300">
            {activeSubCategory}
          </h2>
        </div>

        {/* Main Category Tabs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="flex overflow-x-auto hide-scrollbar pb-4 gap-2 sm:gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  activeMainCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl mt-8">
        {renderSectionGroup('section-kitchen', 'Kitchen', kitchenData)}
        {renderSectionGroup('section-drink', 'Drink', drinkData)}
        {renderSectionGroup('section-alcohol', 'Alcohol', alcoholData)}
        {renderSectionGroup('section-dessert', 'Dessert', dessertData)}
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};

export default MenuPage;
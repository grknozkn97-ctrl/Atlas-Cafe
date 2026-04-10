import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import MenuPage from '@/pages/MenuPage.jsx';
import FoodMenuPage from '@/pages/FoodMenuPage.jsx';
import { MenuProvider } from '@/contexts/MenuContext.jsx';

function App() {
    return (
        <MenuProvider>
            <Router>
                <ScrollToTop />
                <div className="flex flex-col min-h-screen">
                    <Header />
                    <div className="flex-grow">
                        <Routes>
                            <Route path="/" element={<MenuPage />} />
                            <Route path="/drinks" element={<MenuPage />} />
                            <Route path="/alcohol" element={<MenuPage />} />
                            <Route path="/dessert" element={<MenuPage />} />
                            <Route path="/food" element={<FoodMenuPage />} />
                            <Route path="*" element={
                                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                                    <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
                                    <p className="text-muted-foreground mb-8">The page you are looking for doesn't exist.</p>
                                    <a href="/" className="text-primary hover:underline">Return Home</a>
                                </div>
                            } />
                        </Routes>
                    </div>
                    <Footer />
                </div>
            </Router>
        </MenuProvider>
    );
}

export default App;
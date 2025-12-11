import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';

const Layout = () => {
    return (
        <div className="min-h-screen">
            <Header />
            <div>
                <Outlet />
            </div>
        </div>
    );
};

export default Layout;
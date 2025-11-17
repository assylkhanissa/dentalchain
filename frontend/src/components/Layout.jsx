import React from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  const location = useLocation();

  // Пути, на которых не должен отображаться Navbar и Footer
  const hideNavbarPaths = ["/login", "/register"];

  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main>{children}</main>
      {!shouldHideNavbar && <Footer />}
    </>
  );
};

export default Layout;

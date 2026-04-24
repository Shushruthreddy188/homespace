import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import AppLayout from "./pages/AppLayout";
import Buy from "./pages/Buy";
import Homepage from "./pages/Homepage";
import Register from "./pages/Register";
import { AuthProvider } from "./contexts/FakeAuthContext";
import PropertyListing from "./Components/PropertyListing";
import { PropertiesProvider } from "./contexts/PropertiesContext";
import Favorites from "./Components/Favorites";
import UserListings from "./Components/UserListings";

function App() {
  return (
    <div>
      <AuthProvider>
        <PropertiesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="appLayout" element={<AppLayout />}>
                <Route index element={<Navigate replace to="rent" />} />
                <Route path="buy" element={<Buy />} />
                <Route path="rent" element={<Buy />} />
                <Route path="listing" element={<PropertyListing />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="userlistings" element={<UserListings />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </BrowserRouter>
        </PropertiesProvider>
      </AuthProvider>
    </div>
  );
}

export default App;

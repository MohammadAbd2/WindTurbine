import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import TurbineDetails from "./pages/TurbineDetails";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/turbine/:id" element={<TurbineDetails />} />
            </Routes>
        </BrowserRouter>
    );
}